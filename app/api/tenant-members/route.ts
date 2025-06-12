import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  TenantMembers,
  users,
  tenants,
  employeeBranches,
  branches,
} from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId } from "@/lib/db/utils";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import {
  canPerformWriteOperation,
  checkTenantAccess,
} from "@/lib/auth/authorization";

/**
 * GET /api/tenant-members
 * List tenant members with pagination and search (with auth)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const tenantId = searchParams.get("tenantId");
    const offset = (page - 1) * limit;

    const conditions = [];

    // Apply role-based filtering
    if (user.role === "super_admin") {
      // Super admin can see all members, optionally filtered by tenantId
      if (tenantId) {
        const hasAccess = await checkTenantAccess(user, tenantId);
        if (!hasAccess) {
          return createErrorResponse("Forbidden", 403, "FORBIDDEN");
        }
        conditions.push(eq(TenantMembers.tenantId, tenantId));
      }
    } else if (user.role === "tenant_admin") {
      // Tenant admin can only see members in their tenant
      conditions.push(eq(TenantMembers.tenantId, user.tenantId));
    } else {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const employeesList = await db
      .select({
        id: TenantMembers.id,
        userId: TenantMembers.userId,
        tenantId: TenantMembers.tenantId,
        branchId: employeeBranches.branchId,
        branchName: branches.name,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone_number,
        tenantName: tenants.name,
        salary: TenantMembers.salary,
      })
      .from(TenantMembers)
      .leftJoin(users, eq(TenantMembers.userId, users.id))
      .leftJoin(tenants, eq(TenantMembers.tenantId, tenants.id))
      .leftJoin(
        employeeBranches,
        eq(TenantMembers.userId, employeeBranches.employeeId)
      )
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(TenantMembers)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(employeesList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/tenant-members
 * Add a new member to a tenant (with auth)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse(
        "Forbidden: Insufficient permissions",
        403,
        "FORBIDDEN"
      );
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, [
      "userId",
      "tenantId",
    ]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { userId, tenantId } = body;

    // Check if user can access this tenant
    const hasAccess = await checkTenantAccess(user, tenantId);
    if (!hasAccess) {
      return createErrorResponse(
        "Forbidden: Cannot access this tenant",
        403,
        "FORBIDDEN"
      );
    }

    // Verify user exists
    const userToAdd = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userToAdd.length === 0) {
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
    const existingEmployee = await db
      .select()
      .from(TenantMembers)
      .where(
        and(
          eq(TenantMembers.userId, userId),
          eq(TenantMembers.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingEmployee.length > 0) {
      return createErrorResponse(
        "User is already a member of this tenant",
        409,
        "MEMBER_EXISTS"
      );
    }

    const newEmploye = {
      id: generateId("member"),
      userId,
      tenantId,
    };

    await db.insert(TenantMembers).values(newEmploye);

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
      .where(eq(TenantMembers.id, newEmploye.id))
      .limit(1);

    return createSuccessResponse(createdMember[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
