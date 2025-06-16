import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, users, tenants, clients } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("id");
    if (!branchId) {
      return createErrorResponse(
        "Branch ID required",
        400,
        "BRANCH_ID_REQUIRED"
      );
    }

    const body = await request.json();
    const { name, address, supervisorId, clientId } = body;

    const [branch] = await db
      .select({
        id: branches.id,
        clientId: branches.clientId,
        tenantId: clients.tenantId,
      })
      .from(branches)
      .innerJoin(clients, eq(branches.clientId, clients.id))
      .where(eq(branches.id, branchId))
      .limit(1);
    if (!branch) {
      return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    let tenantId = branch.tenantId;
    let allowedClientId = branch.clientId;

    // Verify tenant access
    if (sessionUser.role === "client_admin") {
      if (!sessionUser.clientId || sessionUser.clientId !== allowedClientId) {
        return createErrorResponse(
          "Cannot update branch for this client",
          403,
          "INVALID_CLIENT_ACCESS"
        );
      }
      // client_admin cannot update supervisorId
      if (supervisorId !== undefined) {
        return createErrorResponse(
          "client_admin cannot update supervisor",
          403,
          "INVALID_PERMISSION"
        );
      }
    } else if (sessionUser.role === "super_admin") {
      // super_admin can update any branch
      if (clientId) {
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
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId || sessionUser.tenantId !== tenantId) {
        return createErrorResponse(
          "Cannot update branch for this tenant",
          403,
          "INVALID_TENANT_ACCESS"
        );
      }
      if (clientId) {
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

    // If supervisorId is provided, verify the user exists and is an employee
    if (supervisorId) {
      const [supervisor] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, supervisorId), eq(users.role, "employee")))
        .limit(1);
      if (!supervisor) {
        return createErrorResponse(
          "Supervisor not found or not an employee",
          404,
          "SUPERVISOR_NOT_FOUND"
        );
      }
    }

    if (name && allowedClientId) {
      const existingBranch = await db
        .select()
        .from(branches)
        .where(
          and(
            eq(branches.clientId, allowedClientId),
            eq(branches.name, name),
            sql`${branches.id} != ${branchId}`
          )
        )
        .limit(1);
      if (existingBranch.length > 0) {
        return createErrorResponse(
          "Branch name already exists for this client",
          400,
          "DUPLICATE_BRANCH_NAME"
        );
      }
    }

    // Prepare update data
    const updateData: Partial<typeof branches.$inferInsert> = {};
    if (name) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (supervisorId !== undefined) updateData.supervisorId = supervisorId;
    if (clientId) updateData.clientId = clientId;

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse(
        "No fields provided to update",
        400,
        "NO_UPDATE_FIELDS"
      );
    }

    await db.update(branches).set(updateData).where(eq(branches.id, branchId));

    const [updatedBranch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    return createSuccessResponse(updatedBranch, 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("id");
    if (!branchId) {
      return createErrorResponse(
        "Branch ID required",
        400,
        "BRANCH_ID_REQUIRED"
      );
    }

    // Fetch the branch to verify it exists and get its tenantId
    const [branch] = await db
      .select({
        id: branches.id,
        clientId: branches.clientId,
        tenantId: clients.tenantId,
      })
      .from(branches)
      .innerJoin(clients, eq(branches.clientId, clients.id))
      .where(eq(branches.id, branchId))
      .limit(1);
    if (!branch) {
      return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    let tenantId = branch.tenantId;

    // Verify tenant access
    if (sessionUser.role === "client_admin") {
      if (!sessionUser.clientId || sessionUser.clientId !== branch.clientId) {
        return createErrorResponse(
          "Cannot delete branch for this client",
          403,
          "INVALID_CLIENT_ACCESS"
        );
      }
    } else if (sessionUser.role === "super_admin") {
      // super_admin can delete any branch
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId || sessionUser.tenantId !== tenantId) {
        return createErrorResponse(
          "Cannot delete branch for this tenant",
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

    await db.delete(branches).where(eq(branches.id, branchId));

    return createSuccessResponse({ success: true }, 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
