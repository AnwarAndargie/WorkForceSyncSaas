import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { contracts, tenants, clients } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    let whereClause;
    if (user.role === "tenant_admin") {
      if (!user.tenantId) {
        return createErrorResponse("No tenant access", 403, "NO_TENANT_ACCESS");
      }
      whereClause = eq(contracts.tenantId, user.tenantId);
    } else if (user.role === "client_admin") {
      if (!user.clientId) {
        return createErrorResponse("No client access", 403, "NO_CLIENT_ACCESS");
      }
      whereClause = eq(contracts.clientId, user.clientId);
    } else if (user.role !== "super_admin") {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const contractList = await db
      .select({
        id: contracts.id,
        tenantId: contracts.tenantId,
        tenantName: tenants.name,
        clientId: contracts.clientId,
        clientName: clients.name,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        terms: contracts.terms,
        status: contracts.status,
      })
      .from(contracts)
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .where(whereClause);

    return createSuccessResponse(contractList, 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
