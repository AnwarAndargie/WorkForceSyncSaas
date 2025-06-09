import { NextRequest } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET /api/auth/me
 * Get current user session information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("No active session", 401, "NO_SESSION");
    }

    return createSuccessResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
        },
      },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}
