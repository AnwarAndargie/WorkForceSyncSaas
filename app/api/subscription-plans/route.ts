import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { subscriptionPlans } from "@/lib/db/schema";
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
 * GET /api/subscription-plans
 * List subscription plans with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const billingCycle = searchParams.get("billingCycle");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(like(subscriptionPlans.name, `%${search}%`));
    }
    if (billingCycle) {
      conditions.push(eq(subscriptionPlans.billingCycle, billingCycle as "monthly" | "yearly"));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const plansList = await db
      .select()
      .from(subscriptionPlans)
      .where(whereClause)
      .orderBy(desc(subscriptionPlans.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(subscriptionPlans)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(plansList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/subscription-plans
 * Create a new subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "price", "billingCycle"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, description, price, billingCycle } = body;

    // Validate billingCycle
    if (!["monthly", "yearly"].includes(billingCycle)) {
      return createErrorResponse("Invalid billing cycle. Must be 'monthly' or 'yearly'", 400, "INVALID_BILLING_CYCLE");
    }

    const newPlan = {
      id: generateId("plan"),
      name,
      description: description || null,
      price: price.toString(), // Convert to string for decimal field
      billingCycle,
      createdAt: new Date(),
    };

    await db.insert(subscriptionPlans).values(newPlan);

    // Return the created plan
    const createdPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, newPlan.id))
      .limit(1);

    return createSuccessResponse(createdPlan[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 