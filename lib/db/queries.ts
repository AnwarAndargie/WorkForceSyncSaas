import { desc, and, eq } from "drizzle-orm";
import { db } from "./drizzle";
import {
  users,
  organizations,
  plans,
  invitations,
  activityLogs,
  User,
  NewUser,
  Organization,
  NewOrganization,
  Plan,
  NewPlan,
  Invitation,
  NewInvitation,
  ActivityLog,
  NewActivityLog,
} from "./schema";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

// ---------- AUTHENTICATION ----------
// Get authenticated user
export async function getUser(): Promise<User | null> {
  const sessionCookie = (await cookies()).get("session");
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== "string"
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionData.user.id))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}

// ---------- USERS CRUD ----------
// Create user
export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

// Read user by ID
export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

// Read user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user || null;
}
export const updateUser = (id: string, data: Partial<NewUser>) =>
  db.update(users).set(data).where(users.id.eq(id));
// Delete user
export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

// ---------- ORGANIZATIONS CRUD ----------
// Create organization
export async function createOrganization(
  data: NewOrganization
): Promise<Organization> {
  const [org] = await db.insert(organizations).values(data).returning();
  return org;
}

// Read organization by ID
export async function getOrganizationById(
  id: string
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return org || null;
}

export const getAllOrganizations = async (): Promise<Organization[]> =>
  db.select().from(organizations);

// Read organization by subdomain
export async function getOrganizationBySubdomain(
  subdomain: string
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.subdomain, subdomain))
    .limit(1);
  return org || null;
}

// Read organization by Stripe customer ID (updated from getTeamByStripeCustomerId)
export async function getOrganizationByStripeCustomerId(
  customerId: string
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);
  return org || null;
}

// Update organization
export async function updateOrganization(
  id: string,
  data: Partial<NewOrganization>
): Promise<Organization | null> {
  const [org] = await db
    .update(organizations)
    .set(data)
    .where(eq(organizations.id, id))
    .returning();
  return org || null;
}

// Update organization subscription (updated from updateTeamSubscription)
export async function updateOrganizationSubscription(
  orgId: string,
  subscriptionData: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeSubscriptionPriceId?: string | null;
    stripeSubscriptionStatus?: string;
    stripeSubscriptionCurrentPeriodEnd?: number | null;
  }
): Promise<Organization | null> {
  const [org] = await db
    .update(organizations)
    .set(subscriptionData)
    .where(eq(organizations.id, orgId))
    .returning();
  return org || null;
}

// Delete organization
export async function deleteOrganization(id: string): Promise<void> {
  await db.delete(organizations).where(eq(organizations.id, id));
}

// Read plan by ID
export async function getPlanById(id: string): Promise<Plan | null> {
  const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return plan || null;
}

export const getAllPlans = async (): Promise<Plan[]> => db.select().from(plans);

// Read plan by Stripe price ID
export async function getPlanByStripePriceId(
  priceId: string
): Promise<Plan | null> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.stripePriceId, priceId))
    .limit(1);
  return plan || null;
}

// Update plan
export async function updatePlan(
  id: string,
  data: Partial<NewPlan>
): Promise<Plan | null> {
  const [plan] = await db
    .update(plans)
    .set(data)
    .where(eq(plans.id, id))
    .returning();
  return plan || null;
}

// Delete plan
export async function deletePlan(id: string): Promise<void> {
  await db.delete(plans).where(eq(plans.id, id));
}

// ---------- INVITATIONS CRUD ----------
// Create invitation
export async function createInvitation(
  data: NewInvitation
): Promise<Invitation> {
  const [invitation] = await db.insert(invitations).values(data).returning();
  return invitation;
}

// Read invitation by ID
export async function getInvitationById(
  id: string
): Promise<Invitation | null> {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, id))
    .limit(1);
  return invitation || null;
}

export const getAllInvitations = async (): Promise<Invitation[]> =>
  db.select().from(invitations);

// Read invitations for organization
export async function getInvitationsForOrganization(
  orgId: string
): Promise<Invitation[]> {
  return await db
    .select()
    .from(invitations)
    .where(eq(invitations.organizationId, orgId));
}

// Update invitation
export async function updateInvitation(
  id: string,
  data: Partial<NewInvitation>
): Promise<Invitation | null> {
  const [invitation] = await db
    .update(invitations)
    .set({ ...data, respondedAt: data.status ? new Date() : undefined })
    .where(eq(invitations.id, id))
    .returning();
  return invitation || null;
}

// Delete invitation
export async function deleteInvitation(id: string): Promise<void> {
  await db.delete(invitations).where(eq(invitations.id, id));
}

// ---------- ACTIVITY LOGS CRUD ----------
// Create activity log
export async function createActivityLog(
  data: NewActivityLog
): Promise<ActivityLog> {
  const [log] = await db.insert(activityLogs).values(data).returning();
  return log;
}

// Read activity logs for user (updated from getActivityLogs)
export async function getActivityLogsForUser(limit: number = 10): Promise<
  Array<{
    id: string;
    action: string;
    timestamp: Date;
    ipAddress: string | null;
    userName: string | null;
  }>
> {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// Delete activity log
export async function deleteActivityLog(id: string): Promise<void> {
  await db.delete(activityLogs).where(eq(activityLogs.id, id));
}
