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
import { getSessionUser } from "@/lib/auth/session";
import { canPerformWriteOperation } from "@/lib/auth/authorization";

/**
 * GET /api/subscription-plans
 * List subscription plans with pagination and search (with auth)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

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
      conditions.push(like(subscriptionPlans.billingCycle, billingCycle));
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
 * Create a new subscription plan (with auth - super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Only super_admin can create subscription plans
    if (user.role !== "super_admin") {
      return createErrorResponse("Forbidden: Only super admins can create subscription plans", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const validationError = validateRequiredFields(body, ["name", "price", "billingCycle"]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const { name, description, price, billingCycle } = body;

    const newPlan = {
      id: generateId("plan"),
      name,
      description: description || null,
      price: price.toString(),
      billingCycle,
      createdAt: new Date(),
    };

    await db.insert(subscriptionPlans).values(newPlan);

    return createSuccessResponse(newPlan, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
} 