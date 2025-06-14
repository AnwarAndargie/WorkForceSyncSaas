import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, clients, users } from "@/lib/db/schema";
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
 * GET /api/branches
 * List branches with pagination and search (tenant isolated)
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
    const clientId = searchParams.get("clientId");
    const offset = (page - 1) * limit;

    // Build query based on user role and access permissions
    let whereConditions: any[] = [];

    if (sessionUser.role === "super_admin") {
      // Super admin can specify tenant or client filter
      const requestedTenantId = searchParams.get("tenantId");
      if (requestedTenantId) {
        whereConditions.push(eq(branches.tenantId, requestedTenantId));
      }
      if (clientId) {
        whereConditions.push(eq(branches.clientId, clientId));
      }
    } else if (sessionUser.role === "tenant_admin") {
      // Tenant admin can only see branches in their tenant
      if (!sessionUser.tenantId) {
        return createErrorResponse("User not associated with a tenant", 403, "NO_TENANT_ACCESS");
      }
      whereConditions.push(eq(branches.tenantId, sessionUser.tenantId));
      if (clientId) {
        whereConditions.push(eq(branches.clientId, clientId));
      }
    } else if (sessionUser.role === "client_admin") {
      // Client admin can only see branches of their client
      if (!sessionUser.clientId) {
        return createErrorResponse("User not associated with a client", 403, "NO_CLIENT_ACCESS");
      }
      whereConditions.push(eq(branches.clientId, sessionUser.clientId));
    } else {
      return createErrorResponse("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
    }

    if (search) {
      whereConditions.push(like(branches.name, `%${search}%`));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const branchList = await db
      .select()
      .from(branches)
      .where(whereClause)
      .orderBy(desc(branches.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(branches)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(branchList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/branches
 * Create a new branch (tenant isolated)
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "clientId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, address, clientId, supervisorId } = body;

    // Verify client exists and user has access to it
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const clientData = client[0];

    // Check access permissions based on user role
    if (sessionUser.role === "super_admin") {
      // Super admin can create branches for any client
    } else if (sessionUser.role === "tenant_admin") {
      // Tenant admin can only create branches for clients in their tenant
      if (!sessionUser.tenantId || clientData.tenantId !== sessionUser.tenantId) {
        return createErrorResponse("Cannot access this client", 403, "CLIENT_ACCESS_DENIED");
      }
    } else if (sessionUser.role === "client_admin") {
      // Client admin can only create branches for their own client
      if (!sessionUser.clientId || clientData.id !== sessionUser.clientId) {
        return createErrorResponse("Cannot access this client", 403, "CLIENT_ACCESS_DENIED");
      }
    } else {
      return createErrorResponse("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
    }

    // If supervisorId is provided, verify the user exists and has appropriate role
    if (supervisorId) {
      const supervisor = await db
        .select()
        .from(users)
        .where(eq(users.id, supervisorId))
        .limit(1);

      if (supervisor.length === 0) {
        return createErrorResponse("Supervisor not found", 404, "SUPERVISOR_NOT_FOUND");
      }

      // Supervisor should be an employee or higher role
      if (!["employee", "client_admin", "tenant_admin", "super_admin"].includes(supervisor[0].role || "")) {
        return createErrorResponse("Invalid supervisor role", 400, "INVALID_SUPERVISOR_ROLE");
      }
    }

    // Create the branch
    const branchId = generateId("branch");
    await db.insert(branches).values({
      id: branchId,
      name,
      address,
      supervisorId,
      tenantId: clientData.tenantId,
      clientId,
      createdAt: new Date(),
    });

    const createdBranch = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    return createSuccessResponse(createdBranch[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
