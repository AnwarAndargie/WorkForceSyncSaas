import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { tenants, TenantMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = params.id;

    // First delete all members linked to the tenant
    await db.delete(TenantMembers).where(eq(TenantMembers.tenantId, tenantId));

    // Then delete the tenant itself
    const result = await db.delete(tenants).where(eq(tenants.id, tenantId));

    if (result.rowsAffected === 0) {
      return createErrorResponse("Tenant not found", 404);
    }

    return createSuccessResponse(
      { message: "Tenant and its members deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = params.id;
    const body = await request.json();

    const allowedFields = ["name", "logo", "email", "phone", "address"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        updatePayload[key] = body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    const result = await db
      .update(tenants)
      .set(updatePayload)
      .where(eq(tenants.id, tenantId));

    if (result.rowsAffected === 0) {
      return createErrorResponse("Tenant not found", 404);
    }

    return createSuccessResponse(
      { message: "Tenant updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}
