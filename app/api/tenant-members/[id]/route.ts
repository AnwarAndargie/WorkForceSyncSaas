import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { TenantMembers, users, tenants, branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import {
  canPerformWriteOperation,
  checkTenantAccess,
} from "@/lib/auth/authorization";

/**
 * GET /api/tenant-members/[id]
 * Get a specific tenant member (with auth)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const employeeId = params.id;

    // First get the member to check access
    const employeeCheck = await db
      .select({ tenantId: TenantMembers.tenantId })
      .from(TenantMembers)
      .where(eq(TenantMembers.id, employeeId))
      .limit(1);

    if (employeeCheck.length === 0) {
      return createErrorResponse(
        "Tenant member not found",
        404,
        "MEMBER_NOT_FOUND"
      );
    }

    // Check if user can access this tenant
    // const hasAccess = await checkTenantAccess(user, employeeCheck[0].tenantId);
    // if (!hasAccess) {
    //   return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    // }

    const employee = await db
      .select({
        id: TenantMembers.id,
        userId: TenantMembers.userId,
        tenantId: TenantMembers.tenantId,
        userName: users.name,
        userEmail: users.email,
        tenantName: tenants.name,
      })
      .from(TenantMembers)
      .leftJoin(users, eq(TenantMembers.userId, users.id))
      .leftJoin(tenants, eq(TenantMembers.tenantId, tenants.id))
      .where(eq(TenantMembers.id, employeeId))
      .limit(1);

    return createSuccessResponse(employee[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse(
        "Forbidden: Insufficient permissions",
        403,
        "FORBIDDEN"
      );
    }

    const employeeId = await params.id;

    // Check authorization
    // const authorized = await authorizeUserFor("client", clientId, user);
    // if (!authorized) {
    //   return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    // }

    const body = await request.json();

    const allowedFieldsTenantMember = ["salary", "branchId"];
    const allowedFieldsUser = ["name", "phone_number", "email"];
    const updatePayloadTenantMember: Record<string, any> = {};
    const updatePayloadUser: Record<string, any> = {};

    for (const key of allowedFieldsTenantMember) {
      if (key in body) {
        updatePayloadTenantMember[key] = body[key];
      }
    }
    for (const key of allowedFieldsUser) {
      if (key in body) {
        updatePayloadUser[key] = body[key];
      }
    }

    if (Object.keys(updatePayloadTenantMember).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    // Verify branch exists if branchId is being updated
    if (updatePayloadTenantMember.branchId) {
      const branch = await db
        .select()
        .from(branches)
        .where(eq(branches.id, updatePayloadTenantMember.branchId))
        .limit(1);

      if (branch.length === 0) {
        return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
      }
    }

    // Check if employee exists
    const existingEmployee = await db
      .select()
      .from(TenantMembers)
      .where(eq(TenantMembers.id, employeeId))
      .limit(1);

    if (existingEmployee.length === 0) {
      return createErrorResponse(
        "Employee not found",
        404,
        "Employee_NOT_FOUND"
      );
    }

    // Update the Employee
    await db
      .update(TenantMembers)
      .set(updatePayloadTenantMember)
      .where(eq(TenantMembers.id, employeeId));

    await db
      .update(users)
      .set(updatePayloadUser)
      .where(eq(users.id, employeeId));

    return createSuccessResponse(
      { message: "Employee updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/tenant-members/[id]
 * Remove a member from a tenant (with auth)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse(
        "Forbidden: Insufficient permissions",
        403,
        "FORBIDDEN"
      );
    }

    const memberId = params.id;

    // First check if the member exists and get tenant info
    const existingMember = await db
      .select({ tenantId: TenantMembers.tenantId })
      .from(TenantMembers)
      .where(eq(TenantMembers.id, memberId))
      .limit(1);

    if (existingMember.length === 0) {
      return createErrorResponse(
        "Tenant member not found",
        404,
        "MEMBER_NOT_FOUND"
      );
    }

    // Check if user can access this tenant
    // const hasAccess = await checkTenantAccess(user, existingMember[0].tenantId);
    // if (!hasAccess) {
    //   return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    // }

    // Delete the member
    await db.delete(TenantMembers).where(eq(TenantMembers.id, memberId));

    return createSuccessResponse(
      { message: "Tenant member removed successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}
