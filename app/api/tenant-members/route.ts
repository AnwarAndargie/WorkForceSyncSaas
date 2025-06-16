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
import { eq, or, like, and, sql } from "drizzle-orm";
import { getSessionUser, hashPassword } from "@/lib/auth/session";
import {
  canPerformWriteOperation,
  checkTenantAccess,
} from "@/lib/auth/authorization";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search") || "";
    const tenantId = searchParams.get("tenantId");
    const offset = (page - 1) * limit;

    const conditions = [
      eq(users.role, "employee"), // Filter for employee role
    ];

    // Apply role-based filtering
    if (user.role === "super_admin") {
      if (tenantId) {
        conditions.push(eq(TenantMembers.tenantId, tenantId));
      }
    } else if (user.role === "tenant_admin") {
      // if (!user.tenantId) {
      //   return createErrorResponse("No tenant access", 403, "NO_TENANT_ACCESS");
      // }
      conditions.push(eq(TenantMembers.tenantId, user.tenantId));
    } else {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    // Add search filter
    // if (search) {
    //   conditions.push(
    //     or(
    //       like(users.name, `%${search}%`),
    //       like(users.email, `%${search}%`),
    //       like(users.phone_number, `%${search}%`)
    //     )
    //   );
    // }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const employeesList = await db
      .select({
        id: TenantMembers.id,
        userId: TenantMembers.userId,
        tenantId: TenantMembers.tenantId,
        branchId: employeeBranches.branchId,
        branchName: branches.name,
        name: users.name,
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
      .leftJoin(branches, eq(employeeBranches.branchId, branches.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(TenantMembers)
      .leftJoin(users, eq(TenantMembers.userId, users.id))
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(employeesList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, [
      "tenantId",
      "name",
      "email",
      "salary",
      "phone_number",
    ]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { tenantId, salary, branchId, name, email, phone_number } = body;

    // Validate salary
    if (isNaN(salary) || salary < 0) {
      return createErrorResponse("Invalid salary", 400, "INVALID_SALARY");
    }

    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (tenant.length === 0) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    if (branchId) {
      const branch = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);
      if (branch.length === 0) {
        return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
      }
    }

    // Verify user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser.length > 0) {
      const isAlreadyMember = await db
        .select()
        .from(TenantMembers)
        .where(
          and(
            eq(TenantMembers.userId, existingUser[0].id),
            eq(TenantMembers.tenantId, tenantId)
          )
        )
        .limit(1);
      if (isAlreadyMember.length > 0) {
        return createErrorResponse(
          "User is already a member of this tenant",
          409,
          "MEMBER_EXISTS"
        );
      }
      return createErrorResponse(
        "User already exists but not in this tenant. Consider inviting.",
        400,
        "USER_EXISTS_DIFFERENT_TENANT"
      );
    }

    // Create new user and tenant member
    const userId = generateId("user");
    const memberId = generateId("member");

    const newUser = {
      id: userId,
      name,
      email,
      role: "employee" as "super_admin" | "client_admin" | "tenant_admin",
      passwordHash: await hashPassword("abc1234"),
      createdAt: new Date(),
      phone_number,
    };

    const newTenantMember = {
      id: memberId,
      userId,
      tenantId,
      salary,
    };

    // Insert user and tenant member
    await db.transaction(async (tx) => {
      await tx.insert(users).values(newUser);
      await tx.insert(TenantMembers).values(newTenantMember);
      if (branchId) {
        await tx.insert(employeeBranches).values({
          id: generateId("emp_branch"),
          employeeId: userId,
          branchId,
          assignedAt: new Date(),
        });
      }
    });

    // Return created member
    const createdMember = await db
      .select({
        id: TenantMembers.id,
        userId: TenantMembers.userId,
        tenantId: TenantMembers.tenantId,
        branchId: employeeBranches.branchId,
        branchName: branches.name,
        name: users.name,
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
      .leftJoin(branches, eq(employeeBranches.branchId, branches.id))
      .where(eq(TenantMembers.id, memberId))
      .limit(1);

    return createSuccessResponse(createdMember[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
