import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { tenants, users } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId, generateSlug } from "@/lib/db/utils";
import { eq, desc, like, count, and } from "drizzle-orm";

/**
 * GET /api/tenants
 * List tenants with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(like(tenants.name, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute queries
    const [orgList, totalCount] = await Promise.all([
      db
        .select()
        .from(tenants)
        .where(whereClause)
        .orderBy(desc(tenants.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(tenants).where(whereClause),
    ]);

    const meta = createPaginationMeta(totalCount[0].count, page, limit);

    return createSuccessResponse(orgList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/tenants
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequiredFields(body, ["name", "ownerId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, ownerId, logo } = body;

    // Verify that the owner exists
    const owner = await db
      .select()
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);

    if (owner.length === 0) {
      return createErrorResponse(
        "Owner user not found",
        404,
        "OWNER_NOT_FOUND"
      );
    }

    // Generate slug from name
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const existingOrg = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      if (existingOrg.length === 0) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const orgId = generateId("org");

    // Create organization
    const newOrg = {
      id: orgId,
      name,
      slug,
    };

    await db.insert(tenants).values(newOrg);

    // Get the created organization
    const [createdOrg] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, orgId))
      .limit(1);

    // Add owner as organization member
    const memberData = {
      id: generateId("member"),
      userId: ownerId,
      organizationId: orgId,
      role: "owner" as const,
    };

    await db.insert(organizationMembers).values(memberData);

    return createSuccessResponse(createdOrg, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
