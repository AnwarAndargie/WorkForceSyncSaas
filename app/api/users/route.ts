import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, TenantMembers } from "@/lib/db/schema";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const role = searchParams.get("role") as
      | "super_admin"
      | "client_admin"
      | "tenant_admin"
      | "employee";

    if (!tenantId) {
      return createErrorResponse(
        "Tenant ID required",
        400,
        "MISSING_TENANT_ID"
      );
    }

    if (
      sessionUser.role !== "super_admin" &&
      sessionUser.tenantId !== tenantId
    ) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const conditions = [eq(TenantMembers.tenantId, tenantId)];
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .innerJoin(TenantMembers, eq(users.id, TenantMembers.userId))
      .where(and(...conditions));

    return createSuccessResponse(userList, 200);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, "SERVER_ERROR");
  }
}
