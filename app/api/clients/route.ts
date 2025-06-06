import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { clients, tenants, branches } from "@/lib/db/schema";
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
 * GET /api/clients
 * List clients with pagination and search
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
      conditions.push(like(clients.name, `%${search}%`));
    }
    if (tenantId) {
      conditions.push(eq(clients.tenantId, parseInt(tenantId)));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get clients with tenant and branch details
    const clientsList = await db
      .select({
        id: clients.id,
        tenantId: clients.tenantId,
        name: clients.name,
        phone: clients.phone,
        address: clients.address,
        branchId: clients.branchId,
        tenantName: tenants.name,
        branchName: branches.name,
      })
      .from(clients)
      .leftJoin(tenants, eq(clients.tenantId, tenants.id))
      .leftJoin(branches, eq(clients.branchId, branches.id))
      .where(whereClause)
      .orderBy(desc(clients.name))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(clients)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(clientsList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "tenantId"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, tenantId, phone, address, branchId } = body;

    // Verify tenant exists
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    // Verify branch exists if provided
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

    const newClient = {
      id: generateId("client"),
      tenantId,
      name,
      phone: phone || null,
      address: address || null,
      branchId: branchId || null,
    };

    await db.insert(clients).values(newClient);

    // Return the created client with joined data
    const createdClient = await db
      .select({
        id: clients.id,
        tenantId: clients.tenantId,
        name: clients.name,
        phone: clients.phone,
        address: clients.address,
        branchId: clients.branchId,
        tenantName: tenants.name,
        branchName: branches.name,
      })
      .from(clients)
      .leftJoin(tenants, eq(clients.tenantId, tenants.id))
      .leftJoin(branches, eq(clients.branchId, branches.id))
      .where(eq(clients.id, newClient.id))
      .limit(1);

    return createSuccessResponse(createdClient[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 