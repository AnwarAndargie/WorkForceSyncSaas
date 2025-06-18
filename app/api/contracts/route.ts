import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { contracts, tenants, clients, users } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { eq, and, isNotNull } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { generateId } from "@/lib/db/utils";
import { validateRequiredFields } from "@/lib/api/response";

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
      whereClause = and(
        eq(clients.tenantId, user.tenantId),
        isNotNull(clients.tenantId)
      );
    } else if (user.role === "client_admin") {
      if (!user.clientId && !user.id) {
        return createErrorResponse("No client access", 403, "NO_CLIENT_ACCESS");
      }
      whereClause = and(
        user.clientId
          ? eq(clients.id, user.clientId)
          : eq(clients.adminId, user.id),
        isNotNull(clients.tenantId)
      );
    } else if (user.role === "super_admin") {
      whereClause = isNotNull(clients.tenantId);
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const clientList = await db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        address: clients.address,
        adminId: clients.adminId,
        tenantId: clients.tenantId,
        tenantName: tenants.name,
      })
      .from(clients)
      .innerJoin(tenants, eq(clients.tenantId, tenants.id))
      .where(whereClause);

    return createSuccessResponse(clientList, 200);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return handleDatabaseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const {
      name,
      phone,
      address,
      adminId,
      tenantId: requestedTenantId,
      terms = "Standard contract terms",
      status = "active",
    } = body;

    let tenantId: string;

    if (sessionUser.role === "super_admin") {
      if (!requestedTenantId) {
        return createErrorResponse(
          "tenantId required for super_admin",
          400,
          "TENANT_ID_REQUIRED"
        );
      }
      tenantId = requestedTenantId;
    } else if (sessionUser.role === "tenant_admin") {
      if (!sessionUser.tenantId) {
        return createErrorResponse(
          "User not associated with a tenant",
          403,
          "NO_TENANT_ACCESS"
        );
      }
      tenantId = sessionUser.tenantId;
      if (requestedTenantId && requestedTenantId !== tenantId) {
        return createErrorResponse(
          "Cannot create client for another tenant",
          403,
          "INVALID_TENANT_ACCESS"
        );
      }
    } else {
      return createErrorResponse(
        "Insufficient permissions",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (tenant.length === 0) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    // If adminId is provided, verify the user exists and is a client_admin
    if (adminId) {
      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);
      if (adminUser.length === 0) {
        return createErrorResponse(
          "Admin user not found",
          404,
          "ADMIN_NOT_FOUND"
        );
      }
      if (adminUser[0].role !== "client_admin") {
        return createErrorResponse(
          "User must have client_admin role",
          400,
          "INVALID_ADMIN_ROLE"
        );
      }
    }

    const existingClient = await db
      .select()
      .from(clients)
      .where(and(eq(clients.tenantId, tenantId), eq(clients.name, name)))
      .limit(1);
    if (existingClient.length > 0) {
      return createErrorResponse(
        "Client name already exists",
        400,
        "DUPLICATE_CLIENT_NAME"
      );
    }

    const clientId = generateId("client");
    const contractId = generateId("contract");
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    console.log(
      `Creating client: ${clientId}, tenant: ${tenantId}, contract: ${contractId}`
    );

    // Perform client and contract insertion in a transaction
    await db.transaction(async (tx) => {
      await tx.insert(clients).values({
        id: clientId,
        name,
        phone,
        address,
        adminId,
        tenantId,
      });

      await tx.insert(contracts).values({
        id: contractId,
        tenantId,
        clientId,
        startDate,
        endDate,
        terms,
        status,
      });
    });

    const [createdClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    return createSuccessResponse({ client: createdClient, contractId }, 201);
  } catch (error) {
    console.error("Error creating client/contract:", error);
    return handleDatabaseError(error);
  }
}
