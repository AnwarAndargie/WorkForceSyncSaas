import { eq } from "drizzle-orm";
import { db } from "../drizzle";
import { plans, Plan, NewPlan } from "../schema";

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
export const createPlan = async (data: NewPlan): Promise<Plan> => {
  const [plan] = await db.insert(plans).values(data).returning();
  return plan;
};

// Delete plan
export async function deletePlan(id: string): Promise<void> {
  await db.delete(plans).where(eq(plans.id, id));
}
