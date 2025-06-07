import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { activityLogs, tenants, users } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId } from "@/lib/db/utils";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";

/**
 * GET /api/activity-logs
 * List activity logs with pagination, filtering by organization, user, and date range
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const organizationId = searchParams.get("organizationId");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (organizationId) {
      conditions.push(eq(activityLogs.organizationId, organizationId));
    }

    if (userId) {
      conditions.push(eq(activityLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }

    if (entity) {
      conditions.push(eq(activityLogs.entity, entity));
    }

    if (startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute queries with joins to get user and organization names
    const [logsList, totalCount] = await Promise.all([
      db
        .select({
          id: activityLogs.id,
          organizationId: activityLogs.organizationId,
          organizationName: tenants.name,
          userId: activityLogs.userId,
          userName: users.name,
          userEmail: users.email,
          action: activityLogs.action,
          entity: activityLogs.entity,
          entityId: activityLogs.entityId,
          details: activityLogs.details,
          ipAddress: activityLogs.ipAddress,
          userAgent: activityLogs.userAgent,
          createdAt: activityLogs.createdAt,
        })
        .from(activityLogs)
        .leftJoin(tenants, eq(activityLogs.organizationId, tenants.id))
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(activityLogs).where(whereClause),
    ]);

    const meta = createPaginationMeta(totalCount[0].count, page, limit);

    return createSuccessResponse(logsList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/activity-logs
 * Create a new activity log entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequiredFields(body, [
      "organizationId",
      "userId",
      "action",
      "entity",
    ]);
    if (validationError) {
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");
    }

    const {
      organizationId,
      userId,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent,
    } = body;

    // Verify organization exists
    const org = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, organizationId))
      .limit(1);

    if (org.length === 0) {
      return createErrorResponse(
        "Organization not found",
        404,
        "ORGANIZATION_NOT_FOUND"
      );
    }

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return createErrorResponse("User not found", 404, "USER_NOT_FOUND");
    }

    // Create activity log
    const newLog = {
      id: generateId("log"),
      organizationId,
      userId,
      action,
      entity,
      entityId: entityId || null,
      details: details || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    };

    await db.insert(activityLogs).values(newLog);

    // Get the created log with user and organization details
    const [createdLog] = await db
      .select({
        id: activityLogs.id,
        organizationId: activityLogs.organizationId,
        organizationName: tenants.name,
        userId: activityLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: activityLogs.action,
        entity: activityLogs.entity,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .leftJoin(tenants, eq(activityLogs.organizationId, tenants.id))
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.id, newLog.id))
      .limit(1);

    return createSuccessResponse(createdLog, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
