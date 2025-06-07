import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, users, tenants, clients } from "@/lib/db/schema";
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
import { canPerformWriteOperation, checkTenantAccess, checkClientAccess } from "@/lib/auth/authorization";

/**
 * GET /api/branches
 * List branches with pagination and search (with auth)
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
    const clientId = searchParams.get("clientId");
    const offset = (page - 1) * limit;

    const conditions = [];
    
    // Apply role-based filtering
    if (user.role === "super_admin") {
      // Super admin can see all branches, optionally filtered
      if (tenantId) {
        conditions.push(eq(branches.tenantId, tenantId));
      }
      if (clientId) {
        conditions.push(eq(branches.clientId, clientId));
      }
    } else if (user.role === "tenant_admin" && user.tenantId) {
      // Tenant admin can only see branches in their tenant
      conditions.push(eq(branches.tenantId, user.tenantId));
      if (clientId) {
        // Verify the client belongs to their tenant
        const authorized = await checkClientAccess(user, clientId);
        if (!authorized) {
          return createErrorResponse("Forbidden", 403, "FORBIDDEN");
        }
        conditions.push(eq(branches.clientId, clientId));
      }
    } else if (user.role === "client_admin" && user.clientId) {
      // Client admin can only see branches for their client
      conditions.push(eq(branches.clientId, user.clientId));
    } else {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    if (search) {
      conditions.push(like(branches.name, `%${search}%`));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get branches with supervisor, tenant, and client details
    const branchesList = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        tenantId: branches.tenantId,
        clientId: branches.clientId,
        createdAt: branches.createdAt,
        supervisorName: users.name,
        supervisorEmail: users.email,
        tenantName: tenants.name,
        clientName: clients.name,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
      .leftJoin(tenants, eq(branches.tenantId, tenants.id))
      .leftJoin(clients, eq(branches.clientId, clients.id))
      .where(whereClause)
      .orderBy(desc(branches.name))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(branches)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(branchesList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/branches
 * Create a new branch (with auth)
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
    const validationError = validateRequiredFields(body, ["name", "tenantId", "clientId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, address, supervisorId, tenantId, clientId } = body;

    // Check if user can access this tenant
    const hasTenantAccess = await checkTenantAccess(user, tenantId);
    if (!hasTenantAccess) {
      return createErrorResponse("Forbidden: Cannot access this tenant", 403, "FORBIDDEN");
    }

    // Check if user can access this client
    const hasClientAccess = await checkClientAccess(user, clientId);
    if (!hasClientAccess) {
      return createErrorResponse("Forbidden: Cannot access this client", 403, "FORBIDDEN");
    }

    // Verify supervisor exists if provided
    if (supervisorId) {
      const supervisor = await db
        .select()
        .from(users)
        .where(eq(users.id, supervisorId))
        .limit(1);

      if (supervisor.length === 0) {
        return createErrorResponse("Supervisor not found", 404, "SUPERVISOR_NOT_FOUND");
      }
    }

    const newBranch = {
      id: generateId("branch"),
      name,
      address: address || null,
      supervisorId: supervisorId || null,
      tenantId,
      clientId,
      createdAt: new Date(),
    };

    await db.insert(branches).values(newBranch);

    // Return the created branch with joined data
    const createdBranch = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        tenantId: branches.tenantId,
        clientId: branches.clientId,
        createdAt: branches.createdAt,
        supervisorName: users.name,
        supervisorEmail: users.email,
        tenantName: tenants.name,
        clientName: clients.name,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
      .leftJoin(tenants, eq(branches.tenantId, tenants.id))
      .leftJoin(clients, eq(branches.clientId, clients.id))
      .where(eq(branches.id, newBranch.id))
      .limit(1);

    return createSuccessResponse(createdBranch[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
