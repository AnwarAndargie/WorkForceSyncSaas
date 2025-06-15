import { NextRequest } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { clearSessionCookie, getSessionUser } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Clear user session and logout
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is logged in
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("No active session", 401, "NO_SESSION");
    }

    // Clear session
    await clearSessionCookie();

    return createSuccessResponse(
      {
        message: "Logout successful",
      },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * GET /api/auth/logout
 * Alternative logout method for GET requests
 */
export async function GET(request: NextRequest) {
  return POST(request);
} 