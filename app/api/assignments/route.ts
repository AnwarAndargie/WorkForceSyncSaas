import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { assignments, users, clients } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId } from "@/lib/db/utils";
import { eq, desc, like, and, sql } from "drizzle-orm";

/**
 * GET /api/assignments
 * List assignments with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const clientId = searchParams.get("clientId");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      // We can search by employee or client name through joins
    }
    if (status) {
      conditions.push(eq(assignments.status, status as "active" | "inactive" | "completed"));
    }
    if (employeeId) {
      conditions.push(eq(assignments.employeeId, parseInt(employeeId)));
    }
    if (clientId) {
      conditions.push(eq(assignments.clientId, parseInt(clientId)));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get assignments with employee and client details
    const assignmentsList = await db
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
      .where(whereClause)
      .orderBy(desc(assignments.startDate))
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
 * Create a new assignment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["employeeId", "clientId", "startDate"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { employeeId, clientId, startDate, endDate, status } = body;

    // Verify employee exists
    const employee = await db
      .select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return createErrorResponse("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    // Verify client exists
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const newAssignment = {
      id: generateId("assignment"),
      employeeId,
      clientId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: status || "active",
    };

    await db.insert(assignments).values(newAssignment);

    // Return the created assignment with joined data
    const createdAssignment = await db
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
      .where(eq(assignments.id, newAssignment.id))
      .limit(1);

    return createSuccessResponse(createdAssignment[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 