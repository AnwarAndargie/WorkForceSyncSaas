import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
} from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "super_admin") {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const planId = params.id;

    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (plan.length === 0) {
      return createErrorResponse(
        "Subscription plan not found",
        404,
        "PLAN_NOT_FOUND"
      );
    }

    return createSuccessResponse(plan[0], 200);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (user.role !== "super_admin") {
      return createErrorResponse(
        "Forbidden: Only super admins can update subscription plans",
        403,
        "FORBIDDEN"
      );
    }

    const planId = params.id;
    const body = await request.json();

    const allowedFields = ["name", "description", "price", "billingCycle"];
    const updatePayload: Record<string, any> = {};

    for (const key of allowedFields) {
      if (key in body) {
        if (key === "price") {
          updatePayload[key] = body[key].toString();
        } else {
          updatePayload[key] = body[key];
        }
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }

    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (existingPlan.length === 0) {
      return createErrorResponse(
        "Subscription plan not found",
        404,
        "PLAN_NOT_FOUND"
      );
    }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (user.role !== "super_admin") {
      return createErrorResponse(
        "Forbidden: Only super admins can delete subscription plans",
        403,
        "FORBIDDEN"
      );
    }

    const planId = params.id;

    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (existingPlan.length === 0) {
      return createErrorResponse(
        "Subscription plan not found",
        404,
        "PLAN_NOT_FOUND"
      );
    }

    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, planId));

    return createSuccessResponse(
      { message: "Subscription plan deleted successfully" },
      200
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}
