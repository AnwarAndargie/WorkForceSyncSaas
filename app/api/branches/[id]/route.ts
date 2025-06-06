import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";

/**
 * GET /api/branches/[id]
 * Get a specific branch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;

    const branch = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        supervisorName: users.name,
        supervisorEmail: users.email,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
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
 * Update a branch
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;
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
 * Delete a branch
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;

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