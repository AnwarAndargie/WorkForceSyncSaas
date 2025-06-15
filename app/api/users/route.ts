import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleDatabaseError, 
  validateRequiredFields,
  createPaginationMeta
} from '@/lib/api/response';
import { generateId, hashPassword } from '@/lib/db/utils';
import { eq, desc, like, count } from 'drizzle-orm';

/**
 * GET /api/users
 * List users with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = db.select().from(users);
    let countQuery = db.select({ count: count() }).from(users);

    // Add search filter if provided
    if (search) {
      const searchFilter = like(users.name, `%${search}%`);
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    // Execute queries
    const [userList, totalCount] = await Promise.all([
      query
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      countQuery
    ]);

    // Remove passwords from response
    const safeUsers = userList.map(({ password, ...user }) => user);

    const meta = createPaginationMeta(totalCount[0].count, page, limit);

    return createSuccessResponse(safeUsers, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequiredFields(body, ['email', 'password']);
    if (validationError) {
      return createErrorResponse(validationError, 400, 'VALIDATION_ERROR');
    }

    const { email, password, name } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return createErrorResponse(
        'User with this email already exists',
        409,
        'EMAIL_EXISTS'
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = {
      id: generateId('user'),
      email,
      password: hashedPassword,
      name: name || null,
      emailVerified: false,
    };

    const [createdUser] = await db.insert(users).values(newUser).returning();

    // Remove password from response
    const { password: _, ...safeUser } = createdUser;

    return createSuccessResponse(safeUser, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 