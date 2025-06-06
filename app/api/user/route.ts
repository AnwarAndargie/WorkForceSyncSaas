import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { eq } from "drizzle-orm";

/**
 * GET /api/user
 * Get current user information
 * This would typically use session/auth middleware to get the current user ID
 */
export async function GET(request: NextRequest) {
  try {
    // In a real application, you would get the user ID from the session/JWT token
    // For now, we'll use a query parameter or header
    const userId =
      request.headers.get("x-user-id") ||
      request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return createErrorResponse(
        "User ID is required",
        400,
        "USER_ID_REQUIRED"
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return createErrorResponse("User not found", 404, "USER_NOT_FOUND");
    }

    // Remove password from response
    const { passwordHash, ...safeUser } = user[0];

    return createSuccessResponse(safeUser);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
