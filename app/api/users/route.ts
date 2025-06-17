import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Restrict access to super_admin and tenant_admin
    if (!["super_admin", "tenant_admin"].includes(sessionUser.role)) {
      return createErrorResponse("Forbidden", 403, "INSUFFICIENT_PERMISSIONS");
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as
      | "super_admin"
      | "client_admin"
      | "tenant_admin"
      | "employee";

    // if (!role) {
    //   return createErrorResponse("Role required", 400, "MISSING_ROLE");
    // }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(eq(users.role, role));

    return createSuccessResponse(userList, 200);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, "SERVER_ERROR");
  }
}
