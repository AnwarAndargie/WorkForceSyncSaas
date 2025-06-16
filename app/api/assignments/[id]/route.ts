import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { assignments, users, clients, events, branches } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { canPerformWriteOperation, authorizeUserFor } from "@/lib/auth/authorization";

/**
 * GET /api/assignments/[id]
 * Get a specific assignment (with auth)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const assignmentId = params.id;

    // Get assignment with all related data
    const assignment = await db
      .select({
        id: assignments.id,
        employeeId: assignments.employeeId,
        eventId: assignments.eventId,
        branchId: assignments.branchId,
        clientId: assignments.clientId,
        startDate: assignments.startDate,
        endDate: assignments.endDate,
        status: assignments.status,
        createdAt: assignments.createdAt,
        employeeName: users.name,
        employeeEmail: users.email,
        clientName: clients.name,
        eventName: events.name,
        eventDescription: events.description,
        eventStartTime: events.startTime,
        eventEndTime: events.endTime,
        branchName: branches.name,
        branchAddress: branches.address,
      })
      .from(assignments)
      .leftJoin(users, eq(assignments.employeeId, users.id))
      .leftJoin(clients, eq(assignments.clientId, clients.id))
      .leftJoin(events, eq(assignments.eventId, events.id))
      .leftJoin(branches, eq(assignments.branchId, branches.id))
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (assignment.length === 0) {
      return createErrorResponse("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    const assignmentData = assignment[0];

    // Check access permissions
    if (user.role === "employee") {
      // Employee can only see their own assignments
      if (assignmentData.employeeId !== user.id) {
        return createErrorResponse("Forbidden", 403, "FORBIDDEN");
      }
    } else if (user.role === "tenant_admin") {
      // Tenant admin can see assignments for their tenant
      if (assignmentData.tenantId !== user.tenantId) {
        return createErrorResponse("Forbidden", 403, "FORBIDDEN");
      }
    } else {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    return createSuccessResponse(assignmentData, 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/assignments/[id]
 * Update assignment status (employees can accept/reject, tenant admins can update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const assignmentId = params.id;
    const body = await request.json();

    // Get the current assignment
    const currentAssignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (currentAssignment.length === 0) {
      return createErrorResponse("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    const assignment = currentAssignment[0];

    // Check permissions
    if (user.role === "employee") {
      // Employee can only update their own assignments and only the status
      if (assignment.employeeId !== user.id) {
        return createErrorResponse("Forbidden", 403, "FORBIDDEN");
      }
      
      // Employees can only update status to accepted or rejected
      const { status } = body;
      if (!status || !["accepted", "rejected"].includes(status)) {
        return createErrorResponse("Invalid status. Employees can only accept or reject assignments.", 400, "INVALID_STATUS");
      }

      await db
        .update(assignments)
        .set({ status })
        .where(eq(assignments.id, assignmentId));

    } else if (user.role === "tenant_admin") {
      // Tenant admin can update assignments for their tenant
      if (assignment.tenantId !== user.tenantId) {
        return createErrorResponse("Forbidden", 403, "FORBIDDEN");
      }

      // Tenant admin can update various fields
      const updateData: any = {};
      if (body.status) updateData.status = body.status;
      if (body.startDate) updateData.startDate = new Date(body.startDate);
      if (body.endDate) updateData.endDate = new Date(body.endDate);

      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No valid fields to update", 400, "NO_UPDATE_FIELDS");
      }

      await db
        .update(assignments)
        .set(updateData)
        .where(eq(assignments.id, assignmentId));

    } else {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    // Return updated assignment with joined data
    const updatedAssignment = await db
      .select({
        id: assignments.id,
        employeeId: assignments.employeeId,
        eventId: assignments.eventId,
        branchId: assignments.branchId,
        clientId: assignments.clientId,
        startDate: assignments.startDate,
        endDate: assignments.endDate,
        status: assignments.status,
        createdAt: assignments.createdAt,
        employeeName: users.name,
        employeeEmail: users.email,
        clientName: clients.name,
        eventName: events.name,
        eventDescription: events.description,
        eventStartTime: events.startTime,
        eventEndTime: events.endTime,
        branchName: branches.name,
        branchAddress: branches.address,
      })
      .from(assignments)
      .leftJoin(users, eq(assignments.employeeId, users.id))
      .leftJoin(clients, eq(assignments.clientId, clients.id))
      .leftJoin(events, eq(assignments.eventId, events.id))
      .leftJoin(branches, eq(assignments.branchId, branches.id))
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    return createSuccessResponse(updatedAssignment[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/assignments/[id]
 * Delete an assignment (tenant admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (user.role !== "tenant_admin" || !user.tenantId) {
      return createErrorResponse("Forbidden: Only tenant admins can delete assignments", 403, "FORBIDDEN");
    }

    const assignmentId = params.id;

    // Verify assignment exists and belongs to tenant
    const assignment = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.tenantId, user.tenantId)))
      .limit(1);

    if (assignment.length === 0) {
      return createErrorResponse("Assignment not found or access denied", 404, "ASSIGNMENT_NOT_FOUND");
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    return createSuccessResponse({ message: "Assignment deleted successfully" }, 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 