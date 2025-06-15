import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, users, tenants, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { canPerformWriteOperation, authorizeUserFor } from "@/lib/auth/authorization";

/**
 * GET /api/branches/[id]
 * Get a specific branch (with auth)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const branchId = params.id;

    // Check authorization
    const authorized = await authorizeUserFor("branch", branchId, user);
    if (!authorized) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const branch = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        tenantId: branches.tenantId,
        clientId: branches.clientId,
        createdAt: branches.createdAt,
        supervisorName: users.name,
        supervisorEmail: users.email,
        tenantName: tenants.name,
        clientName: clients.name,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
      .leftJoin(tenants, eq(branches.tenantId, tenants.id))
      .leftJoin(clients, eq(branches.clientId, clients.id))
      .where(eq(branches.id, branchId))
      .limit(1);

    if (branch.length === 0) {
      return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    return createSuccessResponse(branch[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/branches/[id]
 * Update a branch (with auth)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    const branchId = params.id;

    // Check authorization
    const authorized = await authorizeUserFor("branch", branchId, user);
    if (!authorized) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const body = await request.json();

    const allowedFields = ["name", "address", "supervisorId"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        updatePayload[key] = body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    // Verify supervisor exists if supervisorId is being updated
    if (updatePayload.supervisorId) {
      const supervisor = await db
        .select()
        .from(users)
        .where(eq(users.id, updatePayload.supervisorId))
        .limit(1);

      if (supervisor.length === 0) {
        return createErrorResponse("Supervisor not found", 404, "SUPERVISOR_NOT_FOUND");
      }
    }

    // Check if branch exists
    const existingBranch = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (existingBranch.length === 0) {
      return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    // Update the branch
    await db
      .update(branches)
      .set(updatePayload)
      .where(eq(branches.id, branchId));

    return createSuccessResponse(
      { message: "Branch updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/branches/[id]
 * Delete a branch (with auth)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!canPerformWriteOperation(user)) {
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    const branchId = params.id;

    // Check authorization
    const authorized = await authorizeUserFor("branch", branchId, user);
    if (!authorized) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    // Check if branch exists
    const existingBranch = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (existingBranch.length === 0) {
      return createErrorResponse("Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    // Delete the branch
    await db
      .delete(branches)
      .where(eq(branches.id, branchId));

    return createSuccessResponse(
      { message: "Branch deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 