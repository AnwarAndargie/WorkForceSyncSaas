import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { invoices, contracts, clients, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";

/**
 * GET /api/invoices/[id]
 * Get a specific invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    const invoice = await db
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
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (invoice.length === 0) {
      return createErrorResponse("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }

    return createSuccessResponse(invoice[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/invoices/[id]
 * Update an invoice
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const body = await request.json();

    const allowedFields = ["amount", "dueDate", "paid"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        if (key === "dueDate") {
          updatePayload[key] = new Date(body[key]);
        } else if (key === "amount") {
          updatePayload[key] = body[key].toString();
        } else if (key === "paid") {
          updatePayload[key] = body[key];
          // If marking as paid, set paidAt timestamp
          if (body[key] === true) {
            updatePayload.paidAt = new Date();
          } else if (body[key] === false) {
            updatePayload.paidAt = null;
          }
        } else {
          updatePayload[key] = body[key];
        }
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    // Check if invoice exists
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existingInvoice.length === 0) {
      return createErrorResponse("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }

    // Update the invoice
    await db
      .update(invoices)
      .set(updatePayload)
      .where(eq(invoices.id, invoiceId));

    return createSuccessResponse(
      { message: "Invoice updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/invoices/[id]
 * Delete an invoice
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    // Check if invoice exists
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existingInvoice.length === 0) {
      return createErrorResponse("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }

    // Delete the invoice
    await db
      .delete(invoices)
      .where(eq(invoices.id, invoiceId));

    return createSuccessResponse(
      { message: "Invoice deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 