import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { clients, tenants, branches } from "@/lib/db/schema";
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
import { canPerformWriteOperation, checkTenantAccess } from "@/lib/auth/authorization";

/**
 * GET /api/clients
 * List clients with pagination and search (with auth)
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
    const search = searchParams.get("search");
    const tenantId = searchParams.get("tenantId");
    const offset = (page - 1) * limit;

    const conditions = [];
    
    // Apply role-based filtering
    if (user.role === "super_admin") {
      // Super admin can see all clients, optionally filtered by tenantId
      if (tenantId) {
        conditions.push(eq(clients.tenantId, tenantId));
      }
    } else if (user.role === "tenant_admin" && user.tenantId) {
      // Tenant admin can only see clients in their tenant
      conditions.push(eq(clients.tenantId, user.tenantId));
    } else if (user.role === "client_admin" && user.clientId) {
      // Client admin can only see their own client (but this endpoint might not be relevant for them)
      conditions.push(eq(clients.id, user.clientId));
    } else {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    if (search) {
      conditions.push(like(clients.name, `%${search}%`));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get clients with tenant details
    const clientsList = await db
      .select({
        id: clients.id,
        tenantId: clients.tenantId,
        name: clients.name,
        phone: clients.phone,
        address: clients.address,
        adminId: clients.adminId,
        tenantName: tenants.name,
      })
      .from(clients)
      .leftJoin(tenants, eq(clients.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(clients.name))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(clients)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(clientsList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/clients
 * Create a new client (with auth)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "tenantId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, tenantId, phone, address, adminId } = body;

    // Check if user can access this tenant
    const hasAccess = await checkTenantAccess(user, tenantId);
    if (!hasAccess) {
      return createErrorResponse("Forbidden: Cannot access this tenant", 403, "FORBIDDEN");
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

    const newClient = {
      id: generateId("client"),
      tenantId,
      name,
      phone: phone || null,
      address: address || null,
      adminId: adminId || null,
    };

    await db.insert(clients).values(newClient);

    // Return the created client with joined data
    const createdClient = await db
      .select({
        id: clients.id,
        tenantId: clients.tenantId,
        name: clients.name,
        phone: clients.phone,
        address: clients.address,
        adminId: clients.adminId,
        tenantName: tenants.name,
      })
      .from(clients)
      .leftJoin(tenants, eq(clients.tenantId, tenants.id))
      .where(eq(clients.id, newClient.id))
      .limit(1);

    return createSuccessResponse(createdClient[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 