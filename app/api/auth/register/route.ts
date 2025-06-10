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
import { hashPassword, generateId } from "@/lib/db/utils";
import { setSession } from "@/lib/auth/session";

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, [
      "name",
      "email",
      "password",
      "role",
    ]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, email, password, role } = body;

    // Validate role
    const validRoles = [
      "super_admin",
      "client_admin",
      "tenant_admin",
      "employee",
    ];
    if (!validRoles.includes(role)) {
      return createErrorResponse("Invalid role", 400, "INVALID_ROLE");
    }

    // Check if user with email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return createErrorResponse(
        "User with this email already exists",
        409,
        "USER_EXISTS"
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const newUser = {
      id: generateId("user"),
      name,
      email,
      role: role as
        | "super_admin"
        | "client_admin"
        | "tenant_admin"
        | "employee",
      passwordHash,
      isActive: true,
      createdAt: new Date(),
    };

    await db.insert(users).values(newUser);

    // Create session for the new user
    await setSession(newUser);

    // Return user data (without password)
    const safeUserData = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    return createSuccessResponse(
      {
        user: safeUserData,
        message: "Registration successful",
      },
      201
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}
