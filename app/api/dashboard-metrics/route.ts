import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  tenants,
  clients,
  users,
  branches,
  subscriptions,
  subscriptionPlans,
  TenantMembers,
} from "@/lib/db/schema";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { eq, sql, and, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    let metrics: Record<string, any> = {};

    if (user.role === "super_admin") {
      // Tenant count
      const [{ tenantCount }] = await db
        .select({ tenantCount: sql`COUNT(*)`.mapWith(Number) })
        .from(tenants);

      // Client count
      const [{ clientCount }] = await db
        .select({ clientCount: sql`COUNT(*)`.mapWith(Number) })
        .from(clients);

      // Total revenue
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
      };
    } else if (user.role === "tenant_admin") {
      if (!user.tenantId) {
        return createErrorResponse("No tenant access", 403, "NO_TENANT_ACCESS");
      }

      // Client count
      const [{ clientCount }] = await db
        .select({ clientCount: sql`COUNT(*)`.mapWith(Number) })
        .from(clients)
        .where(eq(clients.tenantId, user.tenantId));

      // Employee count
      const [{ employeeCount }] = await db
        .select({ employeeCount: sql`COUNT(*)`.mapWith(Number) })
        .from(users)
        .innerJoin(TenantMembers, eq(users.id, TenantMembers.userId))
        .where(
          and(
            eq(TenantMembers.tenantId, user.tenantId),
            eq(users.role, "employee")
          )
        );

      // Supervisor count
      const [{ supervisorCount }] = await db
        .select({ supervisorCount: sql`COUNT(*)`.mapWith(Number) })
        .from(branches)
        .innerJoin(clients, eq(branches.clientId, clients.id))
        .where(
          and(
            eq(clients.tenantId, user.tenantId),
            sql`branches.supervisor_id IS NOT NULL`
          )
        );

      // Current plan
      const [currentPlan] = await db
        .select({
          id: subscriptions.id,
          name: subscriptionPlans.name,
        })
        .from(subscriptions)
        .innerJoin(
          subscriptionPlans,
          eq(subscriptions.planId, subscriptionPlans.id)
        )
        .where(eq(subscriptions.tenantId, user.tenantId))
        .limit(1);

      metrics = {
        clients: clientCount,
        employees: employeeCount,
        supervisors: supervisorCount,
        plan: currentPlan || {
          id: "",
          name: "No Active Plan",
          status: "inactive",
        },
      };
    } else if (user.role === "client_admin") {
      if (!user.clientId) {
        return createErrorResponse("No client access", 403, "NO_CLIENT_ACCESS");
      }

      // Branch count
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
