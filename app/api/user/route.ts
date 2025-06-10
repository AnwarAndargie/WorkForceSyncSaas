import { NextRequest } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET /api/user
 * Get current user information based on the session (JWT in cookie)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the session
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    return createSuccessResponse(sessionUser); // already contains id, role, name, email, clientId (if available)
  } catch (error) {
    return handleDatabaseError(error);
  }
}
