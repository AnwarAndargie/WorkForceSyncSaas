import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, users } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId } from "@/lib/db/utils";
import { eq, desc, like, and, sql } from "drizzle-orm";

/**
 * GET /api/branches
 * List branches with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(like(branches.name, `%${search}%`));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get branches with supervisor details
    const branchesList = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        supervisorName: users.name,
        supervisorEmail: users.email,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
      .where(whereClause)
      .orderBy(desc(branches.name))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(branches)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(branchesList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/branches
 * Create a new branch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, address, supervisorId } = body;

    // Verify supervisor exists if provided
    if (supervisorId) {
      const supervisor = await db
        .select()
        .from(users)
        .where(eq(users.id, supervisorId))
        .limit(1);

      if (supervisor.length === 0) {
        return createErrorResponse("Supervisor not found", 404, "SUPERVISOR_NOT_FOUND");
      }
    }

    const newBranch = {
      id: generateId("branch"),
      name,
      address: address || null,
      supervisorId: supervisorId || null,
    };

    await db.insert(branches).values(newBranch);

    // Return the created branch with joined data
    const createdBranch = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        supervisorName: users.name,
        supervisorEmail: users.email,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
      .where(eq(branches.id, newBranch.id))
      .limit(1);

    return createSuccessResponse(createdBranch[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 