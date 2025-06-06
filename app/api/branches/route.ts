import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { branches, users, clients, tenants } from "@/lib/db/schema";
import {
  createSuccessResponse,
  createErrorResponse,
  handleDatabaseError,
  validateRequiredFields,
  createPaginationMeta,
} from "@/lib/api/response";
import { generateId } from "@/lib/db/utils";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth/session";
import { checkUserAccess } from "@/lib/auth/authorization";

/**
 * GET /api/branches
 * List branches scoped to user privilege
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) return createErrorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const clientId = searchParams.get("clientId");

    if (!tenantId) return createErrorResponse("Missing tenantId", 400);

    const authorized = await checkUserAccess(
      userId,
      tenantId,
      clientId ?? undefined
    );
    if (!authorized) return createErrorResponse("Forbidden", 403);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    const conditions = [eq(branches.tenantId, tenantId)];
    if (clientId) conditions.push(eq(branches.clientId, clientId));
    if (search) conditions.push(like(branches.name, `%${search}%`));

    const whereClause = and(...conditions);

    const branchesList = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        supervisorName: users.name,
        supervisorEmail: users.email,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
      .where(whereClause)
      .orderBy(desc(branches.name))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(branches)
      .where(whereClause);

    const meta = createPaginationMeta(count, page, limit);
    return createSuccessResponse(branchesList, 200, meta);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/branches
 * Create branch under a tenant & client with privilege check
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) return createErrorResponse("Unauthorized", 401);

    const body = await request.json();
    const validationError = validateRequiredFields(body, [
      "name",
      "tenantId",
      "clientId",
    ]);
    if (validationError)
      return createErrorResponse(validationError, 400, "VALIDATION_ERROR");

    const { name, address, supervisorId, tenantId, clientId } = body;

    const authorized = await checkUserAccess(userId, tenantId, clientId);
    if (!authorized) return createErrorResponse("Forbidden", 403);

    const newBranch = {
      id: generateId("branch"),
      name,
      address: address || null,
      supervisorId: supervisorId || null,
      tenantId,
      clientId,
    };

    await db.insert(branches).values(newBranch);

    const createdBranch = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        supervisorId: branches.supervisorId,
        supervisorName: users.name,
        supervisorEmail: users.email,
      })
      .from(branches)
      .leftJoin(users, eq(branches.supervisorId, users.id))
      .where(eq(branches.id, newBranch.id))
      .limit(1);

    return createSuccessResponse(createdBranch[0], 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
