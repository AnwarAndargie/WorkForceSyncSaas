import { desc, and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { organizations, Organization, NewOrganization } from "./../schema";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";
import { getPlanById } from "./plans";

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
