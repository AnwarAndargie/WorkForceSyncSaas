import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  clients,
  tenants,
  users,
  TenantMembers,
  contracts,
} from "@/lib/db/schema";
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

    let tenantId: string;

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
    if (search) {
      conditions.push(like(clients.name, `%${search}%`));
    }
    const whereClause = and(...conditions);

    const clientList = await db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        address: clients.address,
        adminId: clients.adminId,
        tenantId: clients.tenantId,
      })
      .from(clients)
      .where(whereClause)
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

    const { name, phone, address, adminId, tenantId: requestedTenantId } = body;

    let tenantId: string;

    if (sessionUser.role === "super_admin") {
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
      if (requestedTenantId && requestedTenantId !== tenantId) {
        return createErrorResponse(
          "Cannot create client for another tenant",
          403,
          "INVALID_TENANT_ACCESS"
        );
      }
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (tenant.length === 0) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    // If adminId is provided, verify the user exists and is a client_admin
    if (adminId) {
      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);
      if (adminUser.length === 0) {
        return createErrorResponse(
          "Admin user not found",
          404,
          "ADMIN_NOT_FOUND"
        );
      }
      if (adminUser[0].role !== "client_admin") {
        return createErrorResponse(
          "User must have client_admin role",
          400,
          "INVALID_ADMIN_ROLE"
        );
      }
    }

    const existingClient = await db
      .select()
      .from(clients)
      .where(and(eq(clients.tenantId, tenantId), eq(clients.name, name)))
      .limit(1);
    if (existingClient.length > 0) {
      return createErrorResponse(
        "Client name already exists",
        400,
        "DUPLICATE_CLIENT_NAME"
      );
    }

    const clientId = generateId("client");
    const contractId = generateId("contract");
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    // Perform client and contract insertion in a transaction
    await db.transaction(async (tx) => {
      await tx.insert(clients).values({
        id: clientId,
        name,
        phone,
        address,
        adminId,
        tenantId,
      });

      await tx.insert(contracts).values({
        id: contractId,
        tenantId,
        clientId,
        startDate,
        endDate,
        terms: "Standard contract terms",
        status: "active",
      });
    });

    const [createdClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    return createSuccessResponse(createdClient, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
