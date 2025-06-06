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

/**
 * GET /api/invoices
 * List invoices with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const paid = searchParams.get("paid");
    const contractId = searchParams.get("contractId");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (paid !== null && paid !== undefined) {
      conditions.push(eq(invoices.paid, paid === "true"));
    }
    if (contractId) {
      conditions.push(eq(invoices.contractId, parseInt(contractId)));
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
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(invoicesList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["contractId", "amount", "dueDate"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { contractId, amount, dueDate, paid } = body;

    // Verify contract exists
    const contract = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1);

    if (contract.length === 0) {
      return createErrorResponse("Contract not found", 404, "CONTRACT_NOT_FOUND");
    }

    const newInvoice = {
      id: generateId("invoice"),
      contractId,
      amount: amount.toString(), // Convert to string for decimal field
      dueDate: new Date(dueDate),
      paid: paid || false,
      paidAt: paid ? new Date() : null,
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