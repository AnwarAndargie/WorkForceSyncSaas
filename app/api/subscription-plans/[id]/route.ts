import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";

/**
 * GET /api/subscription-plans/[id]
 * Get a specific subscription plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;

    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (plan.length === 0) {
      return createErrorResponse("Subscription plan not found", 404, "PLAN_NOT_FOUND");
    }

    return createSuccessResponse(plan[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * PATCH /api/subscription-plans/[id]
 * Update a subscription plan
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;
    const body = await request.json();

    const allowedFields = ["name", "description", "price", "billingCycle"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        if (key === "price") {
          updatePayload[key] = body[key].toString();
        } else if (key === "billingCycle") {
          if (!["monthly", "yearly"].includes(body[key])) {
            return createErrorResponse("Invalid billing cycle. Must be 'monthly' or 'yearly'", 400, "INVALID_BILLING_CYCLE");
          }
          updatePayload[key] = body[key];
        } else {
          updatePayload[key] = body[key];
        }
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    // Check if plan exists
    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (existingPlan.length === 0) {
      return createErrorResponse("Subscription plan not found", 404, "PLAN_NOT_FOUND");
    }

    // Update the plan
    await db
      .update(subscriptionPlans)
      .set(updatePayload)
      .where(eq(subscriptionPlans.id, planId));

    return createSuccessResponse(
      { message: "Subscription plan updated successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * DELETE /api/subscription-plans/[id]
 * Delete a subscription plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;

    // Check if plan exists
    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (existingPlan.length === 0) {
      return createErrorResponse("Subscription plan not found", 404, "PLAN_NOT_FOUND");
    }

    // Delete the plan
    await db
      .delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId));

    return createSuccessResponse(
      { message: "Subscription plan deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
} 