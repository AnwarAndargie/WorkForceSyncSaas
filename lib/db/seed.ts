import { stripe } from "../payments/stripe";
import { db } from "./drizzle";
import {
  organizations,
  users,
  teams,
  team_members,
  plans,
  userRole,
} from "./schema";
import { hashPassword } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid"; // For generating UUIDs if needed
import { addDays } from "date-fns"; // For precise date calculations

async function createStripeProductsAndPrices() {
  console.log("Creating Stripe products and prices...");

  // Create Base plan
  const premiumProduct = await stripe.products.create({
    name: "Premium",
    description: "Premium subscription plan",
  });

  const premiumPrice = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: 800, // $8.00
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  // Create Plus plan
  const plusProduct = await stripe.products.create({
    name: "Plus",
    description: "Plus subscription plan",
  });

  const plusPrice = await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12.00
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  // Insert plans and return their IDs
  const [PremiumPlan] = await db
    .insert(plans)
    .values([
      {
        id: uuidv4(), // Explicitly generate UUID
        name: "Premium",
        price: 1200,
        stripePriceId: premiumPrice.id,
        description: "Premium plan with super advanced features",
      },
    ])
    .returning();

  return { PremiumPlan };
}

async function seed() {
  // Use a transaction to ensure atomicity
  return await db.transaction(async (tx) => {
    try {
      const email = "admin@acme.com";
      const password = "admin123";
      const superAdminPassword = "super123";
      const superAdminEmail = "super@gmail.com";
      const leadEmail = "lead@gmail.com";
      const leadPassword = "lead123";

      const leadPasswordHash = await hashPassword(leadPassword);
      const superAdminPasswordHash = await hashPassword(superAdminPassword);
      const passwordHash = await hashPassword(password);

      // Create Stripe products and plans
      const { PremiumPlan } = await createStripeProductsAndPrices();

      // Generate a unique subdomain
      const organizationName = "LeadWorld Inc.";
      const subdomain = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, ""); // Simple subdomain generation

      // Insert organization
      const [org] = await tx
        .insert(organizations)
        .values({
          id: uuidv4(),
          name: organizationName,
          subdomain,
          planId: PremiumPlan.id, // Use UUID from inserted plan
          stripeCustomerId: null, // Use null for testing
          stripeSubscriptionId: null,
          stripeSubscriptionPriceId: PremiumPlan.stripePriceId,
          stripeSubscriptionStatus: "trialing",
          stripeSubscriptionCurrentPeriodEnd: addDays(new Date(), 30).getTime(), // 30 days from now
        })
        .returning();

      // // Insert admin user
      // const [adminUser] = await tx
      //   .insert(users)
      //   .values({
      //     id: uuidv4(),
      //     email,
      //     name: "Admin User",
      //     passwordHash,
      //     role: userRole.enumValues[1], // "org_admin"
      //     organizationId: org.id,
      //   })
      //   .returning();

      const [SuperAdminUser] = await tx
        .insert(users)
        .values({
          id: uuidv4(),
          email: superAdminEmail,
          name: "Super Admin User",
          passwordHash: superAdminPasswordHash,
          role: userRole.enumValues[0], // "super_admin"
          organizationId: org.id,
        })
        .returning();

      const [LeadUser] = await tx
        .insert(users)
        .values({
          id: uuidv4(),
          email: leadEmail,
          name: "Lead User",
          passwordHash: leadPasswordHash,
          role: userRole.enumValues[2], // "team_lead"
          organizationId: org.id,
        })
        .returning();

      // Insert team
      // const [team] = await tx
      //   .insert(teams)
      //   .values({
      //     id: uuidv4(),
      //     name: "Founders Team",
      //     organizationId: org.id,
      //     leadId: adminUser.id, // Set admin as team lead
      //   })
      //   .returning();

      // // Insert team membership
      // await tx.insert(team_members).values({
      //   userId: adminUser.id,
      //   teamId: team.id,
      //   joinedAt: new Date(),
      // });

      console.log(
        "Seed complete: organization, user, team, plans, and team membership created."
      );
    } catch (error) {
      console.error("Error during seeding:", error);
      throw error; // Roll back transaction on error
    }
  });
}

// Run the seed script
seed()
  .then(() => {
    console.log("Seed script finished successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
