import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { invoices, contracts, clients, tenants } from "@/lib/db/schema";
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
import { canPerformWriteOperation, getTenantScopeCondition } from "@/lib/auth/authorization";

/**
 * GET /api/invoices
 * List invoices with pagination and search (with auth)
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
    const contractId = searchParams.get("contractId");
    const paid = searchParams.get("paid");
    const offset = (page - 1) * limit;

    const conditions = [];
    
    // Apply role-based filtering
    if (user.role === "tenant_admin" && user.tenantId) {
      // Filter by tenant through contracts
      conditions.push(eq(contracts.tenantId, user.tenantId));
    } else if (user.role === "client_admin" && user.clientId) {
      // Filter by client through contracts
      conditions.push(eq(contracts.clientId, user.clientId));
    }

    if (contractId) {
      conditions.push(eq(invoices.contractId, contractId));
    }

    if (paid !== null && paid !== undefined) {
      conditions.push(eq(invoices.paid, paid === 'true'));
    }

    if (search) {
      // Search by amount or contract ID
      conditions.push(like(invoices.contractId, `%${search}%`));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get invoices with contract and client details
    const invoicesList = await db
      .select({
        id: invoices.id,
        contractId: invoices.contractId,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        paid: invoices.paid,
        paidAt: invoices.paidAt,
        contractStatus: contracts.status,
        clientName: clients.name,
        tenantName: tenants.name,
      })
      .from(invoices)
      .leftJoin(contracts, eq(invoices.contractId, contracts.id))
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(invoices.dueDate))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(invoices)
      .leftJoin(contracts, eq(invoices.contractId, contracts.id))
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(invoicesList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/invoices
 * Create a new invoice (with auth)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["contractId", "amount", "dueDate"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { contractId, amount, dueDate, paid = false, paidAt } = body;

    // Verify contract exists and user has access
    const contract = await db
      .select({
        id: contracts.id,
        tenantId: contracts.tenantId,
        clientId: contracts.clientId,
        status: contracts.status,
      })
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1);

    if (contract.length === 0) {
      return createErrorResponse("Contract not found", 404, "CONTRACT_NOT_FOUND");
    }

    // Check tenant access
    const contractData = contract[0];
    if (user.role === "tenant_admin" && user.tenantId !== contractData.tenantId) {
      return createErrorResponse("Forbidden: Cannot access this contract", 403, "FORBIDDEN");
    }

    if (user.role === "client_admin" && user.clientId !== contractData.clientId) {
      return createErrorResponse("Forbidden: Cannot access this contract", 403, "FORBIDDEN");
    }

    const newInvoice = {
      id: generateId("invoice"),
      contractId,
      amount: amount.toString(),
      dueDate: new Date(dueDate),
      paid: Boolean(paid),
      paidAt: paidAt ? new Date(paidAt) : null,
    };

    await db.insert(invoices).values(newInvoice);

    // Return the created invoice with joined data
    const createdInvoice = await db
      .select({
        id: invoices.id,
        contractId: invoices.contractId,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        paid: invoices.paid,
        paidAt: invoices.paidAt,
        contractStatus: contracts.status,
        clientName: clients.name,
        tenantName: tenants.name,
      })
      .from(invoices)
      .leftJoin(contracts, eq(invoices.contractId, contracts.id))
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(eq(invoices.id, newInvoice.id))
      .limit(1);

    return createSuccessResponse(createdInvoice[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 