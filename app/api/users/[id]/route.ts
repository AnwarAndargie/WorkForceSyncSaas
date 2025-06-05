import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleDatabaseError, 
  validateRequiredFields 
} from '@/lib/api/response';
import { hashPassword } from '@/lib/db/utils';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (user.length === 0) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND');
    }

    // Remove password from response
    const { password, ...safeUser } = user[0];

    return createSuccessResponse(safeUser);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PUT /api/users/[id]
 * Update a specific user
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return createErrorResponse('Invalid email format', 400, 'INVALID_EMAIL');
      }

      // Check if email is already taken by another user
      const emailCheck = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (emailCheck.length > 0 && emailCheck[0].id !== id) {
        return createErrorResponse(
          'Email is already taken by another user',
          409,
          'EMAIL_EXISTS'
        );
      }

      updateData.email = body.email;
      updateData.emailVerified = false; // Reset verification if email changes
    }

    if (body.password !== undefined) {
      updateData.password = await hashPassword(body.password);
    }

    if (body.emailVerified !== undefined) {
      updateData.emailVerified = body.emailVerified;
    }

    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar;
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400, 'NO_UPDATE_FIELDS');
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // Remove password from response
    const { password, ...safeUser } = updatedUser;

    return createSuccessResponse(safeUser);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a specific user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND');
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    return createSuccessResponse({ message: 'User deleted successfully' });
  } catch (error) {
    return handleDatabaseError(error);
  }
} 