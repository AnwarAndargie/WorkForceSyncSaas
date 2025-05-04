import { db } from "./drizzle";
import {
  organizations,
  users,
  teams,
  team_members,
  plans,
  activityLogs,
  userRole,
  ActivityType,
} from "./schema";
import { stripe } from "../payments/stripe";
import { hashPassword } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";
import { addDays, getUnixTime } from "date-fns";

export async function seed() {
  console.log("🌱 Starting seed...");

  // --- 1. Create Stripe Products and Prices ---
  console.log("📦 Creating Stripe products and prices...");

  const stripeProducts = [
    { name: "Premium", amount: 800 },
    { name: "Plus", amount: 1200 },
  ];

  const planIds: string[] = [];

  for (const prod of stripeProducts) {
    const product = await stripe.products.create({
      name: prod.name,
      description: `${prod.name} subscription plan`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: prod.amount,
      currency: "usd",
      recurring: { interval: "month", trial_period_days: 7 },
    });

    const plan = await db
      .insert(plans)
      .values({
        name: prod.name,
        price: prod.amount,
        stripePriceId: price.id,
      })
      .returning({ id: plans.id });

    planIds.push(plan[0].id);
  }

  // --- 2. Create Organization ---
  console.log("🏢 Creating organization...");

  const organizationId = uuidv4();
  const orgSubdomain = "acme";

  const organization = await db
    .insert(organizations)
    .values({
      id: organizationId,
      name: "Acme Inc.",
      subdomain: orgSubdomain,
      planId: planIds[0],
      stripeCustomerId: "test_cus_123",
      stripeProductId: "test_prod_123",
      stripeSubscriptionId: "test_sub_123",
      stripeSubscriptionPriceId: "test_price_123",
      stripeSubscriptionStatus: "active",
      stripeSubscriptionCurrentPeriodEnd: getUnixTime(addDays(new Date(), 30)),
    })
    .returning({ id: organizations.id });

  // --- 3. Create Admin User ---
  console.log("👤 Creating user...");

  const password = await hashPassword("admin123");

  const userId = uuidv4();
  const user = await db
    .insert(users)
    .values({
      id: userId,
      email: "admin@acme.com",
      name: "Admin User",
      passwordHash: password,
      role: "super_admin",
      organizationId: organization[0].id,
    })
    .returning({ id: users.id });

  // --- 4. Create Team ---
  console.log("👥 Creating team...");

  const teamId = uuidv4();
  const team = await db
    .insert(teams)
    .values({
      id: teamId,
      name: "Founders",
      organizationId: organization[0].id,
      leadId: user[0].id,
    })
    .returning({ id: teams.id });

  // --- 5. Add team member ---
  console.log("➕ Adding user to team...");

  await db.insert(team_members).values({
    teamId: team[0].id,
    userId: user[0].id,
  });

  // --- 6. Activity Log ---
  console.log("📋 Logging activity...");

  await db.insert(activityLogs).values({
    id: uuidv4(),
    teamId: team[0].id,
    userId: user[0].id,
    action: ActivityType.SIGN_UP,
    ipAddress: "127.0.0.1",
  });

  console.log("✅ Seed completed.");
}
