import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, tenants, clients, users } from "@/lib/db/schema";
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
    const search = searchParams.get("search");
    const clientId = searchParams.get("clientId");
    const offset = (page - 1) * limit;

    let tenantId: string | undefined;
    let allowedClientId: string | undefined;

    if (sessionUser.role === "client_admin") {
      if (!sessionUser.clientId) {
        return createErrorResponse(
          "User not associated with a client",
          403,
          "NO_CLIENT_ACCESS"
        );
      }
      if (!clientId || clientId !== sessionUser.clientId) {
        return createErrorResponse(
          "Invalid client ID",
          403,
          "INVALID_CLIENT_ACCESS"
        );
      }
      allowedClientId = sessionUser.clientId;
      // Fetch tenantId from client
      const [client] = await db
        .select({ tenantId: clients.tenantId })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      if (!client) {
        return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
      }
      tenantId = client.tenantId;
    } else if (sessionUser.role === "super_admin") {
      if (!clientId) {
        return createErrorResponse(
          "clientId required for super_admin",
          400,
          "clientId_REQUIRED"
        );
      }
      // Fetch tenantId from client
      const [client] = await db
        .select({ tenantId: clients.tenantId })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      if (!client) {
        return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
      }
      tenantId = client.tenantId;
      allowedClientId = clientId;
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId) {
        return createErrorResponse(
          "User not associated with a tenant",
          403,
          "NO_TENANT_ACCESS"
        );
      }
      tenantId = sessionUser.tenantId;
      if (clientId) {
        // Verify client belongs to tenant
        const [client] = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
          .limit(1);
        if (!client) {
          return createErrorResponse(
            "Client not found",
            404,
            "CLIENT_NOT_FOUND"
          );
        }
        allowedClientId = clientId;
      }
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const conditions = [];
    if (allowedClientId) {
      conditions.push(eq(branches.clientId, allowedClientId));
    }
    if (search) {
      conditions.push(like(branches.name, `%${search}%`));
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const branchList = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        clientId: branches.clientId,
        createdAt: branches.createdAt,
      })
      .from(branches)
      .where(whereClause)
      .orderBy(desc(branches.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(branches)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(branchList, 200, meta);
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

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "clientId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, address, clientId } = body;

    let tenantId: string;
    let allowedClientId: string;

    if (sessionUser.role === "client_admin") {
      if (!sessionUser.clientId) {
        return createErrorResponse(
          "User not associated with a client",
          403,
          "NO_CLIENT_ACCESS"
        );
      }
      allowedClientId = sessionUser.clientId;
      if (clientId !== allowedClientId) {
        return createErrorResponse(
          "Cannot create branch for another client",
          403,
          "INVALID_CLIENT_ACCESS"
        );
      }
      // Fetch tenantId from client
      const [client] = await db
        .select({ tenantId: clients.tenantId })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      if (!client) {
        return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
      }
      tenantId = client.tenantId;
    } else if (sessionUser.role === "super_admin") {
      const requestedTenantId = body.tenantId;
      if (!requestedTenantId) {
        return createErrorResponse(
          "tenantId required for super_admin",
          400,
          "TENANT_ID_REQUIRED"
        );
      }
      tenantId = requestedTenantId;
      // Verify client belongs to tenant
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
        .limit(1);
      if (!client) {
        return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
      }
      allowedClientId = clientId;
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId) {
        return createErrorResponse(
          "User not associated with a tenant",
          403,
          "NO_TENANT_ACCESS"
        );
      }
      tenantId = sessionUser.tenantId;
      // Verify client belongs to tenant
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
        .limit(1);
      if (!client) {
        return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
      }
      allowedClientId = clientId;
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
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

    // Check for duplicate branch name within client
    const existingBranch = await db
      .select()
      .from(branches)
      .where(and(eq(branches.clientId, clientId), eq(branches.name, name)))
      .limit(1);
    if (existingBranch.length > 0) {
      return createErrorResponse(
        "Branch name already exists for this client",
        400,
        "DUPLICATE_BRANCH_NAME"
      );
    }

    const branchId = generateId("branch");
    await db.insert(branches).values({
      id: branchId,
      name,
      address,
      supervisorId: null, // Enforce null for client_admin
      clientId,
      createdAt: new Date(),
    });

    const [createdBranch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    return createSuccessResponse(createdBranch, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
