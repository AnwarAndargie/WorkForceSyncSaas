// src/app/api/tenants/route.ts

import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { tenants, users, TenantMembers } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId, generateSlug } from "@/lib/db/utils";
import { eq, desc, like, and, sql } from "drizzle-orm";

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

    const conditions = [];
    if (search) {
      conditions.push(like(tenants.name, `%${search}%`));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orgList = await db
      .select()
      .from(tenants)
      .where(whereClause)
      .orderBy(desc(tenants.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(tenants)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(orgList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/tenants
 * Create a new tenant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "ownerId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, ownerId, logo, email, phone, address } = body;

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

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const insertResult = await db.insert(tenants).values({
      name,
      slug,
      email,
      address,
      phone,
      ownerId,
      logo,
    });

    const createdTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (createdTenant.length === 0) {
      return createErrorResponse("Failed to create tenant", 500);
    }

    const memberData = {
      id: generateId("member"),
      userId: ownerId,
      organizationId: createdTenant[0].id,
      role: "owner" as const,
    };

    await db.insert(TenantMembers).values(memberData);

    return createSuccessResponse(createdTenant[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
