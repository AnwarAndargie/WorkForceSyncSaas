import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { TenantMembers, users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { canPerformWriteOperation, checkTenantAccess } from "@/lib/auth/authorization";

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

    const memberId = params.id;

    // First get the member to check access
    const memberCheck = await db
      .select({ tenantId: TenantMembers.tenantId })
      .from(TenantMembers)
      .where(eq(TenantMembers.id, memberId))
      .limit(1);

    if (memberCheck.length === 0) {
      return createErrorResponse("Tenant member not found", 404, "MEMBER_NOT_FOUND");
    }

    // Check if user can access this tenant
    const hasAccess = await checkTenantAccess(user, memberCheck[0].tenantId);
    if (!hasAccess) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const member = await db
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
      .where(eq(TenantMembers.id, memberId))
      .limit(1);

    return createSuccessResponse(member[0], 200);
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
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    const memberId = params.id;

    // First check if the member exists and get tenant info
    const existingMember = await db
      .select({ tenantId: TenantMembers.tenantId })
      .from(TenantMembers)
      .where(eq(TenantMembers.id, memberId))
      .limit(1);

    if (existingMember.length === 0) {
      return createErrorResponse("Tenant member not found", 404, "MEMBER_NOT_FOUND");
    }

    // Check if user can access this tenant
    const hasAccess = await checkTenantAccess(user, existingMember[0].tenantId);
    if (!hasAccess) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    // Delete the member
    await db
      .delete(TenantMembers)
      .where(eq(TenantMembers.id, memberId));

    return createSuccessResponse(
      { message: "Tenant member removed successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 