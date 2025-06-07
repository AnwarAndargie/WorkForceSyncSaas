import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
} from "@/lib/api/response";
import { verifyPassword } from "@/lib/db/utils";
import { setSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["email", "password"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { email, password } = body;

    // Find user by email
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        tenantId: users.tenantId,
        name: users.name,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return createErrorResponse("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const userData = user[0];

    // Check if user is active
    if (!userData.isActive) {
      return createErrorResponse("Account is deactivated", 401, "ACCOUNT_DEACTIVATED");
    }

    // Verify password
    if (!userData.passwordHash) {
      return createErrorResponse("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const isValidPassword = await verifyPassword(password, userData.passwordHash);
    if (!isValidPassword) {
      return createErrorResponse("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    // Create session
    await setSessionCookie(userData.id);

    // Return user data (without password)
    const safeUserData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenantId: userData.tenantId,
    };

    return createSuccessResponse(
      {
        user: safeUserData,
        message: "Login successful",
      },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 