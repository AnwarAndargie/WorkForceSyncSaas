import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { TenantMembers, users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";

/**
 * GET /api/tenant-members/[id]
 * Get a specific tenant member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;

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

    if (member.length === 0) {
      return createErrorResponse("Tenant member not found", 404, "MEMBER_NOT_FOUND");
    }

    return createSuccessResponse(member[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/tenant-members/[id]
 * Remove a member from a tenant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;

    // First check if the member exists
    const existingMember = await db
      .select()
      .from(TenantMembers)
      .where(eq(TenantMembers.id, memberId))
      .limit(1);

    if (existingMember.length === 0) {
      return createErrorResponse("Tenant member not found", 404, "MEMBER_NOT_FOUND");
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