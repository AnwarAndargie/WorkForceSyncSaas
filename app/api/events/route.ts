import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { events, tenants, branches, clients } from "@/lib/db/schema";
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

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    let tenantId: string | undefined;

    if (sessionUser.role === "super_admin") {
      const requestedTenantId = searchParams.get("tenantId");
      if (!requestedTenantId) {
        return createErrorResponse(
          "tenantId required for super_admin",
          400,
          "TENANT_ID_REQUIRED"
        );
      }
      tenantId = requestedTenantId;
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId) {
        return createErrorResponse(
          "User not associated with a tenant",
          403,
          "NO_TENANT_ACCESS"
        );
      }
      tenantId = sessionUser.tenantId;
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const conditions = [eq(clients.tenantId, tenantId)];
    if (status) {
      conditions.push(
        eq(
          events.status,
          status as "scheduled" | "ongoing" | "completed" | "cancelled"
        )
      );
    }
    if (branchId) {
      conditions.push(eq(events.branchId, branchId));
    }
    if (search) {
      conditions.push(like(events.name, `%${search}%`));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

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
      .innerJoin(branches, eq(events.branchId, branches.id))
      .innerJoin(clients, eq(events.clientId, clients.id))
      .where(whereClause)
      .orderBy(desc(events.startTime))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(events)
      .innerJoin(clients, eq(events.clientId, clients.id))
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(eventsList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    let tenantId: string;

    if (sessionUser.role === "super_admin") {
      const body = await request.json();
      const requestedTenantId = body.tenantId;
      if (!requestedTenantId) {
        return createErrorResponse(
          "tenantId required for super_admin",
          400,
          "TENANT_ID_REQUIRED"
        );
      }
      tenantId = requestedTenantId;
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId) {
        return createErrorResponse(
          "User not associated with a tenant",
          403,
          "NO_TENANT_ACCESS"
        );
      }
      tenantId = sessionUser.tenantId;
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, [
      "name",
      "startTime",
      "endTime",
      "branchId",
      "clientId",
    ]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, description, startTime, endTime, branchId, clientId } = body;

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return createErrorResponse("Invalid date format", 400, "INVALID_DATE");
    }
    if (end <= start) {
      return createErrorResponse(
        "End time must be after start time",
        400,
        "INVALID_TIME_RANGE"
      );
    }

    // Verify tenant exists
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (!tenant) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    // Verify branch exists and belongs to tenant
    const [branch] = await db
      .select()
      .from(branches)
      .innerJoin(clients, eq(branches.clientId, clients.id))
      .where(and(eq(branches.id, branchId), eq(clients.tenantId, tenantId)))
      .limit(1);
    if (!branch) {
      return createErrorResponse(
        "Branch not found or access denied",
        404,
        "BRANCH_NOT_FOUND"
      );
    }

    // Verify client exists and belongs to tenant
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
      .limit(1);
    if (!client) {
      return createErrorResponse(
        "Client not found or access denied",
        404,
        "CLIENT_NOT_FOUND"
      );
    }

    // Optional: Check for duplicate event name within client
    const existingEvent = await db
      .select()
      .from(events)
      .where(and(eq(events.clientId, clientId), eq(events.name, name)))
      .limit(1);
    if (existingEvent.length > 0) {
      return createErrorResponse(
        "Event name already exists for this client",
        400,
        "DUPLICATE_EVENT_NAME"
      );
    }

    const eventId = generateId("event");
    await db.insert(events).values({
      id: eventId,
      name,
      description: description || null,
      startTime: start,
      endTime: end,
      branchId,
      clientId,
      tenantId,
      status: "scheduled",
      createdAt: new Date(),
    });

    const [createdEvent] = await db
      .select({
        id: events.id,
        name: events.name,
        description: events.description,
        startTime: events.startTime,
        endTime: events.endTime,
        branchId: events.branchId,
        clientId: events.clientId,
        tenantId: events.tenantId,
        status: events.status,
        createdAt: events.createdAt,
        branchName: branches.name,
        branchAddress: branches.address,
        clientName: clients.name,
      })
      .from(events)
      .innerJoin(branches, eq(events.branchId, branches.id))
      .innerJoin(clients, eq(events.clientId, clients.id))
      .where(eq(events.id, eventId))
      .limit(1);

    return createSuccessResponse(createdEvent, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
