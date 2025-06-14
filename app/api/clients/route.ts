import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { clients, tenants, users } from "@/lib/db/schema";
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

/**
 * GET /api/clients
 * List clients with pagination and search (tenant isolated)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    // Determine tenant access based on user role
    let tenantId: string;
    
    if (sessionUser.role === "super_admin") {
      // Super admin can specify which tenant's clients to view
      const requestedTenantId = searchParams.get("tenantId");
      if (!requestedTenantId) {
        return createErrorResponse("tenantId required for super_admin", 400, "TENANT_ID_REQUIRED");
      }
      tenantId = requestedTenantId;
    } else if (sessionUser.role === "tenant_admin") {
      // Tenant admin can only see their own tenant's clients
      if (!sessionUser.tenantId) {
        return createErrorResponse("User not associated with a tenant", 403, "NO_TENANT_ACCESS");
      }
      tenantId = sessionUser.tenantId;
    } else {
      return createErrorResponse("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
    }

    const conditions = [eq(clients.tenantId, tenantId)];
    if (search) {
      conditions.push(like(clients.name, `%${search}%`));
    }
    const whereClause = and(...conditions);

    const clientList = await db
      .select()
      .from(clients)
      .where(whereClause)
      .orderBy(desc(clients.id))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(clients)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(clientList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/clients
 * Create a new client (tenant isolated)
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, phone, address, adminId } = body;

    // Determine tenant access based on user role
    let tenantId: string;
    
    if (sessionUser.role === "super_admin") {
      // Super admin can specify which tenant to create client for
      const requestedTenantId = body.tenantId;
      if (!requestedTenantId) {
        return createErrorResponse("tenantId required for super_admin", 400, "TENANT_ID_REQUIRED");
      }
      tenantId = requestedTenantId;
    } else if (sessionUser.role === "tenant_admin") {
      // Tenant admin can only create clients for their own tenant
      if (!sessionUser.tenantId) {
        return createErrorResponse("User not associated with a tenant", 403, "NO_TENANT_ACCESS");
      }
      tenantId = sessionUser.tenantId;
    } else {
      return createErrorResponse("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
    }

    // Verify tenant exists
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    // If adminId is provided, verify the user exists and can be a client admin
    if (adminId) {
      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);

      if (adminUser.length === 0) {
        return createErrorResponse("Admin user not found", 404, "ADMIN_NOT_FOUND");
      }

      if (adminUser[0].role !== "client_admin") {
        return createErrorResponse("User must have client_admin role", 400, "INVALID_ADMIN_ROLE");
      }
    }

    // Create the client
    const clientId = generateId("client");
    await db.insert(clients).values({
      id: clientId,
      name,
      phone,
      address,
      adminId,
      tenantId,
    });

    const createdClient = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    return createSuccessResponse(createdClient[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 