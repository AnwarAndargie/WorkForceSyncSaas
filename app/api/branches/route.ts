import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  branches,
  clients,
  users,
  tenants,
  TenantMembers,
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

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search")?.trim().slice(0, 100);
    const offset = (page - 1) * limit;
    const requestedTenantId = searchParams.get("tenantId");
    const clientId = searchParams.get("clientId");

    let whereConditions: any[] = [];

    if (sessionUser.role === "super_admin") {
      if (!requestedTenantId && !clientId) {
        return createErrorResponse(
          "tenantId or clientId required for super_admin",
          400,
          "FILTER_REQUIRED"
        );
      }
      if (requestedTenantId) {
        const tenant = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, requestedTenantId))
          .limit(1);
        if (tenant.length === 0) {
          return createErrorResponse(
            "Tenant not found",
            404,
            "TENANT_NOT_FOUND"
          );
        }
        whereConditions.push(eq(branches.tenantId, requestedTenantId));
      }
      if (clientId) {
        const client = await db
          .select()
          .from(clients)
          .where(eq(clients.id, clientId))
          .limit(1);
        if (client.length === 0) {
          return createErrorResponse(
            "Client not found",
            404,
            "CLIENT_NOT_FOUND"
          );
        }
        if (requestedTenantId && client[0].tenantId !== requestedTenantId) {
          return createErrorResponse(
            "Client does not belong to this tenant",
            400,
            "INVALID_CLIENT_TENANT"
          );
        }
        whereConditions.push(eq(branches.clientId, clientId));
      }
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId) {
        return createErrorResponse(
          "User not associated with a tenant",
          403,
          "NO_TENANT_ACCESS"
        );
      }
      whereConditions.push(eq(branches.tenantId, sessionUser.tenantId));
      if (clientId) {
        const client = await db
          .select()
          .from(clients)
          .where(eq(clients.id, clientId))
          .limit(1);
        if (client.length === 0) {
          return createErrorResponse(
            "Client not found",
            404,
            "CLIENT_NOT_FOUND"
          );
        }
        if (client[0].tenantId !== sessionUser.tenantId) {
          return createErrorResponse(
            "Client does not belong to this tenant",
            400,
            "INVALID_CLIENT_TENANT"
          );
        }
        whereConditions.push(eq(branches.clientId, clientId));
      }
    } else if (sessionUser.role === "client_admin") {
      if (!sessionUser.clientId) {
        return createErrorResponse(
          "User not associated with a client",
          403,
          "NO_CLIENT_ACCESS"
        );
      }
      whereConditions.push(eq(branches.clientId, sessionUser.clientId));
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    if (search) {
      whereConditions.push(like(branches.name, `%${search}%`));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const branchList = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        tenantId: branches.tenantId,
        clientId: branches.clientId,
        supervisorId: branches.supervisorId,
        createdAt: branches.createdAt,
      })
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

    const { name: rawName, address: rawAddress, clientId, supervisorId } = body;
    const name = rawName.trim().slice(0, 255);
    const address = rawAddress?.trim().slice(0, 1000);
    if (!clientId.match(/^[a-zA-Z0-9-]{1,128}$/)) {
      return createErrorResponse(
        "Invalid clientId format",
        400,
        "INVALID_CLIENT_ID"
      );
    }

    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const clientData = client[0];

    if (sessionUser.role === "super_admin") {
      // Super admin can create branches for any client
    } else if (sessionUser.role === "tenant_admin") {
      if (
        !sessionUser.tenantId ||
        clientData.tenantId !== sessionUser.tenantId
      ) {
        return createErrorResponse(
          "Cannot access this client",
          403,
          "CLIENT_ACCESS_DENIED"
        );
      }
    } else if (sessionUser.role === "client_admin") {
      if (!sessionUser.clientId || clientData.id !== sessionUser.clientId) {
        return createErrorResponse(
          "Cannot access this client",
          403,
          "CLIENT_ACCESS_DENIED"
        );
      }
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    if (supervisorId) {
      const supervisor = await db
        .select()
        .from(users)
        .where(eq(users.id, supervisorId))
        .limit(1);

      if (supervisor.length === 0) {
        return createErrorResponse(
          "Supervisor not found",
          404,
          "SUPERVISOR_NOT_FOUND"
        );
      }

      if (
        !["employee", "client_admin", "tenant_admin", "super_admin"].includes(
          supervisor[0].role || ""
        )
      ) {
        return createErrorResponse(
          "Invalid supervisor role",
          400,
          "INVALID_SUPERVISOR_ROLE"
        );
      }

      if (supervisor[0].role !== "super_admin") {
        const tenantMember = await db
          .select()
          .from(TenantMembers)
          .where(
            and(
              eq(TenantMembers.userId, supervisorId),
              eq(TenantMembers.tenantId, clientData.tenantId)
            )
          )
          .limit(1);

        if (tenantMember.length === 0) {
          return createErrorResponse(
            "Supervisor not associated with this tenant",
            400,
            "INVALID_TENANT_MEMBER"
          );
        }
      }
    }

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
    const createdBranch = await db.transaction(async (tx) => {
      await tx.insert(branches).values({
        id: branchId,
        name,
        address,
        supervisorId,
        tenantId: clientData.tenantId,
        clientId,
        createdAt: new Date(),
      });

      const [branch] = await tx
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      return branch;
    });

    return createSuccessResponse(createdBranch, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
