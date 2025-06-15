import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { assignments, users, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
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

    // Check authorization
    const authorized = await authorizeUserFor("assignment", assignmentId, user);
    if (!authorized) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const assignment = await db
      .select({
        id: assignments.id,
        employeeId: assignments.employeeId,
        clientId: assignments.clientId,
        startDate: assignments.startDate,
        endDate: assignments.endDate,
        status: assignments.status,
        employeeName: users.name,
        employeeEmail: users.email,
        clientName: clients.name,
      })
      .from(assignments)
      .leftJoin(users, eq(assignments.employeeId, users.id))
      .leftJoin(clients, eq(assignments.clientId, clients.id))
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (assignment.length === 0) {
      return createErrorResponse("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    return createSuccessResponse(assignment[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/assignments/[id]
 * Update an assignment (with auth)
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

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    const assignmentId = params.id;

    // Check authorization
    const authorized = await authorizeUserFor("assignment", assignmentId, user);
    if (!authorized) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const body = await request.json();

    const allowedFields = ["employeeId", "clientId", "startDate", "endDate", "status"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        if (key === "startDate" || key === "endDate") {
          updatePayload[key] = body[key] ? new Date(body[key]) : null;
        } else {
          updatePayload[key] = body[key];
        }
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    // Verify employee exists if employeeId is being updated
    if (updatePayload.employeeId) {
      const employee = await db
        .select()
        .from(users)
        .where(eq(users.id, updatePayload.employeeId))
        .limit(1);

      if (employee.length === 0) {
        return createErrorResponse("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
      }
    }

    // Verify client exists if clientId is being updated
    if (updatePayload.clientId) {
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, updatePayload.clientId))
        .limit(1);

      if (client.length === 0) {
        return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
      }
    }

    // Check if assignment exists
    const existingAssignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (existingAssignment.length === 0) {
      return createErrorResponse("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    // Update the assignment
    await db
      .update(assignments)
      .set(updatePayload)
      .where(eq(assignments.id, assignmentId));

    return createSuccessResponse(
      { message: "Assignment updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/assignments/[id]
 * Delete an assignment (with auth)
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

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    const assignmentId = params.id;

    // Check authorization
    const authorized = await authorizeUserFor("assignment", assignmentId, user);
    if (!authorized) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    // Check if assignment exists
    const existingAssignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (existingAssignment.length === 0) {
      return createErrorResponse("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    // Delete the assignment
    await db
      .delete(assignments)
      .where(eq(assignments.id, assignmentId));

    return createSuccessResponse(
      { message: "Assignment deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 