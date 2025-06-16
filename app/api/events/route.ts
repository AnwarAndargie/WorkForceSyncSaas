import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { events, branches, clients } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId } from "@/lib/db/utils";
import { eq, desc, and, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET /api/events
 * List events for tenant admin
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (user.role !== "tenant_admin" || !user.tenantId) {
      return createErrorResponse("Forbidden: Only tenant admins can view events", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const offset = (page - 1) * limit;

    const conditions = [eq(events.tenantId, user.tenantId)];
    
    if (status) {
      conditions.push(eq(events.status, status as "scheduled" | "ongoing" | "completed" | "cancelled"));
    }
    if (branchId) {
      conditions.push(eq(events.branchId, branchId));
    }
    
    const whereClause = and(...conditions);

    // Get events with branch and client details
    const eventsList = await db
      .select({
        id: events.id,
        name: events.name,
        description: events.description,
        startTime: events.startTime,
        endTime: events.endTime,
        branchId: events.branchId,
        clientId: events.clientId,
        status: events.status,
        createdAt: events.createdAt,
        branchName: branches.name,
        branchAddress: branches.address,
        clientName: clients.name,
      })
      .from(events)
      .leftJoin(branches, eq(events.branchId, branches.id))
      .leftJoin(clients, eq(events.clientId, clients.id))
      .where(whereClause)
      .orderBy(desc(events.startTime))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(events)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(eventsList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/events
 * Create a new event (tenant admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (user.role !== "tenant_admin" || !user.tenantId) {
      return createErrorResponse("Forbidden: Only tenant admins can create events", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "startTime", "endTime", "branchId", "clientId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, description, startTime, endTime, branchId, clientId } = body;

    // Verify branch exists and belongs to the tenant
    const branch = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, branchId), eq(branches.tenantId, user.tenantId)))
      .limit(1);

    if (branch.length === 0) {
      return createErrorResponse("Branch not found or access denied", 404, "BRANCH_NOT_FOUND");
    }

    // Verify client exists and belongs to the tenant
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, user.tenantId)))
      .limit(1);

    if (client.length === 0) {
      return createErrorResponse("Client not found or access denied", 404, "CLIENT_NOT_FOUND");
    }

    const newEvent = {
      id: generateId("event"),
      name,
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      branchId,
      clientId,
      tenantId: user.tenantId,
      status: "scheduled" as const,
      createdAt: new Date(),
    };

    await db.insert(events).values(newEvent);

    // Return the created event with joined data
    const createdEvent = await db
      .select({
        id: events.id,
        name: events.name,
        description: events.description,
        startTime: events.startTime,
        endTime: events.endTime,
        branchId: events.branchId,
        clientId: events.clientId,
        status: events.status,
        createdAt: events.createdAt,
        branchName: branches.name,
        branchAddress: branches.address,
        clientName: clients.name,
      })
      .from(events)
      .leftJoin(branches, eq(events.branchId, branches.id))
      .leftJoin(clients, eq(events.clientId, clients.id))
      .where(eq(events.id, newEvent.id))
      .limit(1);

    return createSuccessResponse(createdEvent[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 