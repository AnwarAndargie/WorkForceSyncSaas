import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { clients, tenants, branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";

/**
 * GET /api/clients/[id]
 * Get a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    const client = await db
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
      .where(eq(clients.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    return createSuccessResponse(client[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/clients/[id]
 * Update a client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const body = await request.json();

    const allowedFields = ["name", "phone", "address", "branchId"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        updatePayload[key] = body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    // Verify branch exists if branchId is being updated
    if (updatePayload.branchId) {
      const branch = await db
        .select()
        .from(branches)
        .where(eq(branches.id, updatePayload.branchId))
        .limit(1);

      if (branch.length === 0) {
        return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
      }
    }

    // Check if client exists
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (existingClient.length === 0) {
      return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    // Update the client
    await db
      .update(clients)
      .set(updatePayload)
      .where(eq(clients.id, clientId));

    return createSuccessResponse(
      { message: "Client updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    // Check if client exists
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (existingClient.length === 0) {
      return createErrorResponse("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    // Delete the client
    await db
      .delete(clients)
      .where(eq(clients.id, clientId));

    return createSuccessResponse(
      { message: "Client deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 