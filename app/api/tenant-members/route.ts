import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { TenantMembers, users, tenants } from "@/lib/db/schema";
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
 * GET /api/tenant-members
 * List tenant members with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const tenantId = searchParams.get("tenantId");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      // Join with users table to search by user name
      // This would require a more complex query
    }
    if (tenantId) {
      conditions.push(eq(TenantMembers.tenantId, tenantId));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get members with user details
    const membersList = await db
      .select({
        id: TenantMembers.id,
        userId: TenantMembers.userId,
        tenantId: TenantMembers.tenantId,
        userName: users.name,
        userEmail: users.email,
        tenantName: tenants.name,
      })
      .from(TenantMembers)
      .leftJoin(users, eq(TenantMembers.userId, users.id))
      .leftJoin(tenants, eq(TenantMembers.tenantId, tenants.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(TenantMembers)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(membersList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/tenant-members
 * Add a new member to a tenant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["userId", "tenantId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { userId, tenantId } = body;

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return createErrorResponse("User not found", 404, "USER_NOT_FOUND");
    }

    // Verify tenant exists
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    // Check if member already exists
    const existingMember = await db
      .select()
      .from(TenantMembers)
      .where(
        and(
          eq(TenantMembers.userId, userId),
          eq(TenantMembers.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return createErrorResponse(
        "User is already a member of this tenant",
        409,
        "MEMBER_EXISTS"
      );
    }

    const newMember = {
      id: generateId("member"),
      userId,
      tenantId,
    };

    await db.insert(TenantMembers).values(newMember);

    // Return the created member with joined data
    const createdMember = await db
      .select({
        id: TenantMembers.id,
        userId: TenantMembers.userId,
        tenantId: TenantMembers.tenantId,
        userName: users.name,
        userEmail: users.email,
        tenantName: tenants.name,
      })
      .from(TenantMembers)
      .leftJoin(users, eq(TenantMembers.userId, users.id))
      .leftJoin(tenants, eq(TenantMembers.tenantId, tenants.id))
      .where(eq(TenantMembers.id, newMember.id))
      .limit(1);

    return createSuccessResponse(createdMember[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 