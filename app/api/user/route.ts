import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }
    return NextResponse.json(sessionUser);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
