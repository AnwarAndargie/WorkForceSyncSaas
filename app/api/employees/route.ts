import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, TenantMembers, branches, clients } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId, hashPassword } from "@/lib/db/utils";
import { eq, desc, like, and, sql, inArray } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET /api/employees
 * List employees with pagination and search (tenant isolated)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const branchId = searchParams.get("branchId");
    const offset = (page - 1) * limit;

    // Build query based on user role and access permissions
    let whereConditions: any[] = [eq(users.role, "employee")];

    if (sessionUser.role === "super_admin") {
      // Super admin can specify tenant filter
      const requestedTenantId = searchParams.get("tenantId");
      if (requestedTenantId) {
        // Filter employees who are members of the specified tenant
        const tenantMembers = await db
          .select({ userId: TenantMembers.userId })
          .from(TenantMembers)
          .where(eq(TenantMembers.tenantId, requestedTenantId));
        
        const userIds = tenantMembers.map(tm => tm.userId);
        if (userIds.length > 0) {
          whereConditions.push(inArray(users.id, userIds));
        } else {
          // No employees in this tenant
          return createSuccessResponse([], 200, { total: 0, page, limit, hasNext: false, hasPrev: false });
        }
      }
    } else if (sessionUser.role === "tenant_admin") {
      // Tenant admin can only see employees in their tenant
      if (!sessionUser.tenantId) {
        return createErrorResponse("User not associated with a tenant", 403, "NO_TENANT_ACCESS");
      }
      
      const tenantMembers = await db
        .select({ userId: TenantMembers.userId })
        .from(TenantMembers)
        .where(eq(TenantMembers.tenantId, sessionUser.tenantId));
      
      const userIds = tenantMembers.map(tm => tm.userId);
      if (userIds.length > 0) {
        whereConditions.push(inArray(users.id, userIds));
      } else {
        return createSuccessResponse([], 200, { total: 0, page, limit, hasNext: false, hasPrev: false });
      }
    } else if (sessionUser.role === "client_admin") {
      // Client admin can only see employees working at their client's branches
      if (!sessionUser.clientId) {
        return createErrorResponse("User not associated with a client", 403, "NO_CLIENT_ACCESS");
      }
      
      // Get all branches for this client
      const clientBranches = await db
        .select({ id: branches.id })
        .from(branches)
        .where(eq(branches.clientId, sessionUser.clientId));
      
      const branchIds = clientBranches.map(b => b.id);
      
      if (branchIds.length === 0) {
        return createSuccessResponse([], 200, { total: 0, page, limit, hasNext: false, hasPrev: false });
      }
      
      // This would require an employee-branch assignment table in real implementation
      // For now, we'll return employees who are in the same tenant as the client
      const client = await db
        .select({ tenantId: clients.tenantId })
        .from(clients)
        .where(eq(clients.id, sessionUser.clientId))
        .limit(1);
      
      if (client.length > 0) {
        const tenantMembers = await db
          .select({ userId: TenantMembers.userId })
          .from(TenantMembers)
          .where(eq(TenantMembers.tenantId, client[0].tenantId));
        
        const userIds = tenantMembers.map(tm => tm.userId);
        if (userIds.length > 0) {
          whereConditions.push(inArray(users.id, userIds));
        } else {
          return createSuccessResponse([], 200, { total: 0, page, limit, hasNext: false, hasPrev: false });
        }
      }
    } else {
      return createErrorResponse("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
    }

    if (search) {
      whereConditions.push(
        like(users.name, `%${search}%`)
      );
    }

    const whereClause = and(...whereConditions);

    const employeeList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone_number: users.phone_number,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(users)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(employeeList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/employees
 * Create a new employee (tenant isolated)
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "email", "password"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, email, password, phone_number } = body;

    // Determine tenant access based on user role
    let tenantId: string;
    
    if (sessionUser.role === "super_admin") {
      // Super admin can specify which tenant to create employee for
      const requestedTenantId = body.tenantId;
      if (!requestedTenantId) {
        return createErrorResponse("tenantId required for super_admin", 400, "TENANT_ID_REQUIRED");
      }
      tenantId = requestedTenantId;
    } else if (sessionUser.role === "tenant_admin") {
      // Tenant admin can only create employees for their own tenant
      if (!sessionUser.tenantId) {
        return createErrorResponse("User not associated with a tenant", 403, "NO_TENANT_ACCESS");
      }
      tenantId = sessionUser.tenantId;
    } else {
      return createErrorResponse("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
    }

    // Check if user with email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return createErrorResponse("User with this email already exists", 409, "USER_EXISTS");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create the employee user
    const employeeId = generateId("user");
    await db.insert(users).values({
      id: employeeId,
      name,
      email,
      role: "employee",
      passwordHash,
      phone_number,
      isActive: true,
      createdAt: new Date(),
    });

    // Add employee to tenant
    await db.insert(TenantMembers).values({
      id: generateId("member"),
      userId: employeeId,
      tenantId,
    });

    const createdEmployee = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone_number: users.phone_number,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    return createSuccessResponse(createdEmployee[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 