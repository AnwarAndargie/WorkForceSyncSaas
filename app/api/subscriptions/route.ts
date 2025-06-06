import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { subscriptions, tenants, subscriptionPlans } from "@/lib/db/schema";
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
 * GET /api/subscriptions
 * List subscriptions with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const tenantId = searchParams.get("tenantId");
    const isActive = searchParams.get("isActive");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (tenantId) {
      conditions.push(eq(subscriptions.tenantId, parseInt(tenantId)));
    }
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(subscriptions.isActive, isActive === "true"));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get subscriptions with tenant and plan details
    const subscriptionsList = await db
      .select({
        id: subscriptions.id,
        tenantId: subscriptions.tenantId,
        planId: subscriptions.planId,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        isActive: subscriptions.isActive,
        tenantName: tenants.name,
        planName: subscriptionPlans.name,
        planPrice: subscriptionPlans.price,
        planBillingCycle: subscriptionPlans.billingCycle,
      })
      .from(subscriptions)
      .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(whereClause)
      .orderBy(desc(subscriptions.startDate))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(subscriptions)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(subscriptionsList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["tenantId", "planId", "startDate", "endDate"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { tenantId, planId, startDate, endDate, isActive } = body;

    // Verify tenant exists
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return createErrorResponse("Tenant not found", 404, "TENANT_NOT_FOUND");
    }

    // Verify plan exists
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (plan.length === 0) {
      return createErrorResponse("Subscription plan not found", 404, "PLAN_NOT_FOUND");
    }

    const newSubscription = {
      id: generateId("subscription"),
      tenantId,
      planId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true,
    };

    await db.insert(subscriptions).values(newSubscription);

    // Return the created subscription with joined data
    const createdSubscription = await db
      .select({
        id: subscriptions.id,
        tenantId: subscriptions.tenantId,
        planId: subscriptions.planId,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        isActive: subscriptions.isActive,
        tenantName: tenants.name,
        planName: subscriptionPlans.name,
        planPrice: subscriptionPlans.price,
        planBillingCycle: subscriptionPlans.billingCycle,
      })
      .from(subscriptions)
      .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.id, newSubscription.id))
      .limit(1);

    return createSuccessResponse(createdSubscription[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 