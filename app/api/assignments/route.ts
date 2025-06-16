import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { assignments, users, clients, events, branches } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId } from "@/lib/db/utils";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { canPerformWriteOperation, checkClientAccess } from "@/lib/auth/authorization";

/**
 * GET /api/assignments
 * List assignments with pagination and search (with auth)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const offset = (page - 1) * limit;

    const conditions = [];
    
    // Apply role-based filtering
    if (user.role === "tenant_admin" && user.tenantId) {
      // Tenant admin can see all assignments for their tenant
      conditions.push(eq(assignments.tenantId, user.tenantId));
      if (status) {
        conditions.push(eq(assignments.status, status as "pending" | "accepted" | "rejected" | "completed"));
      }
      if (employeeId) {
        conditions.push(eq(assignments.employeeId, employeeId));
      }
    } else if (user.role === "employee") {
      // Employee can only see their own assignments
      conditions.push(eq(assignments.employeeId, user.id));
      if (status) {
        conditions.push(eq(assignments.status, status as "pending" | "accepted" | "rejected" | "completed"));
      }
    } else {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get assignments with employee, client, event, and branch details
    const assignmentsList = await db
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
      .where(whereClause)
      .orderBy(desc(assignments.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(assignments)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(assignmentsList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/assignments
 * Create a new assignment (with auth) - Only tenant_admin can create assignments
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Only tenant_admin can create assignments
    if (user.role !== "tenant_admin" || !user.tenantId) {
      return createErrorResponse("Forbidden: Only tenant admins can create assignments", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["employeeId", "eventId", "branchId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { employeeId, eventId, branchId, startDate, endDate } = body;

    // Verify employee exists and belongs to the tenant
    const employee = await db
      .select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return createErrorResponse("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    // Verify event exists and belongs to the tenant
    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.tenantId, user.tenantId)))
      .limit(1);

    if (event.length === 0) {
      return createErrorResponse("Event not found or access denied", 404, "EVENT_NOT_FOUND");
    }

    // Verify branch exists and belongs to the tenant
    const branch = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, branchId), eq(branches.tenantId, user.tenantId)))
      .limit(1);

    if (branch.length === 0) {
      return createErrorResponse("Branch not found or access denied", 404, "BRANCH_NOT_FOUND");
    }

    const newAssignment = {
      id: generateId("assignment"),
      employeeId,
      eventId,
      branchId,
      tenantId: user.tenantId,
      clientId: event[0].clientId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: "pending" as const,
      createdAt: new Date(),
    };

    await db.insert(assignments).values(newAssignment);

    // Return the created assignment with joined data
    const createdAssignment = await db
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
      .where(eq(assignments.id, newAssignment.id))
      .limit(1);

    return createSuccessResponse(createdAssignment[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 