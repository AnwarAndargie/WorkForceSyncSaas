import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  tenants,
  clients,
  users,
  branches,
  subscriptions,
  subscriptionPlans,
} from "@/lib/db/schema";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { eq, sql, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    let metrics: Record<string, any> = {};

    if (user.role === "super_admin") {
      const [{ tenantCount }] = await db
        .select({ tenantCount: sql`COUNT(*)`.mapWith(Number) })
        .from(tenants);
      const [{ clientCount }] = await db
        .select({ clientCount: sql`COUNT(*)`.mapWith(Number) })
        .from(clients);
      const [{ totalRevenue }] = await db
        .select({ totalRevenue: sql`SUM(price)`.mapWith(Number) })
        .from(subscriptions)
        .leftJoin(
          subscriptionPlans,
          eq(subscriptions.planId, subscriptionPlans.id)
        );

      metrics = {
        tenants: tenantCount,
        clients: clientCount,
        revenue: `$${(totalRevenue || 0).toFixed(2)}`,
      };
    } else if (user.role === "tenant_admin") {
      if (!user.tenantId) {
        return createErrorResponse("No tenant access", 403, "NO_TENANT_ACCESS");
      }
      const [{ clientCount }] = await db
        .select({ clientCount: sql`COUNT(*)`.mapWith(Number) })
        .from(clients)
        .where(eq(clients.tenantId, user.tenantId));
      const [{ employeeCount }] = await db
        .select({ employeeCount: sql`COUNT(*)`.mapWith(Number) })
        .from(users)
        .leftJoin(tenants, eq(tenants.id, user.tenantId))
        .where(eq(users.role, "employee"));
      const [{ supervisorCount }] = await db
        .select({ supervisorCount: sql`COUNT(*)`.mapWith(Number) })
        .from(branches)
        .where(
          and(
            eq(branches.tenantId, user.tenantId),
            sql`supervisor_id IS NOT NULL`
          )
        );

      metrics = {
        clients: clientCount,
        employees: employeeCount,
        supervisors: supervisorCount,
      };
    } else if (user.role === "client_admin") {
      if (!user.clientId) {
        return createErrorResponse("No client access", 403, "NO_CLIENT_ACCESS");
      }
      const [{ branchCount }] = await db
        .select({ branchCount: sql`COUNT(*)`.mapWith(Number) })
        .from(branches)
        .where(eq(branches.clientId, user.clientId));

      metrics = {
        branches: branchCount,
      };
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    return createSuccessResponse(metrics, 200);
  } catch (error) {
    return createErrorResponse("Internal server error", 500, "SERVER_ERROR");
  }
}
