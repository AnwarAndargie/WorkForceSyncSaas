import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { subscriptions, tenants, subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";

/**
 * GET /api/subscriptions/[id]
 * Get a specific subscription
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;

    const subscription = await db
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
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (subscription.length === 0) {
      return createErrorResponse("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    return createSuccessResponse(subscription[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/subscriptions/[id]
 * Update a subscription
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;
    const body = await request.json();

    const allowedFields = ["planId", "startDate", "endDate", "isActive"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        if (key === "startDate" || key === "endDate") {
          updatePayload[key] = new Date(body[key]);
        } else {
          updatePayload[key] = body[key];
        }
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    // Verify plan exists if planId is being updated
    if (updatePayload.planId) {
      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, updatePayload.planId))
        .limit(1);

      if (plan.length === 0) {
        return createErrorResponse("Subscription plan not found", 404, "PLAN_NOT_FOUND");
      }
    }

    // Check if subscription exists
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (existingSubscription.length === 0) {
      return createErrorResponse("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    // Update the subscription
    await db
      .update(subscriptions)
      .set(updatePayload)
      .where(eq(subscriptions.id, subscriptionId));

    return createSuccessResponse(
      { message: "Subscription updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/subscriptions/[id]
 * Delete a subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;

    // Check if subscription exists
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (existingSubscription.length === 0) {
      return createErrorResponse("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    // Delete the subscription
    await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, subscriptionId));

    return createSuccessResponse(
      { message: "Subscription deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 