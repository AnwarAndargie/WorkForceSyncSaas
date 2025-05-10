import Stripe from "stripe";
import { db } from "./db/drizzle";
import { organizations, plans } from "./db/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export async function createStripeCustomer(orgId: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  if (org.stripeCustomerId) {
    return org.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    name: org.name,
    metadata: {
      organizationId: org.id,
    },
  });

  await db
    .update(organizations)
    .set({ stripeCustomerId: customer.id })
    .where(eq(organizations.id, orgId));

  return customer.id;
}

export async function createStripeSubscription(orgId: string, planId: string) {
  const [org, plan] = await Promise.all([
    db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    }),
    db.query.plans.findFirst({
      where: eq(plans.id, planId),
    }),
  ]);

  if (!org || !plan) {
    throw new Error("Organization or plan not found");
  }

  if (!plan.stripePriceId) {
    throw new Error("Plan is not configured with Stripe");
  }

  const customerId = await createStripeCustomer(orgId);

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: plan.stripePriceId }],
    metadata: {
      organizationId: org.id,
      planId: plan.id,
    },
  });

  await db
    .update(organizations)
    .set({
      stripeSubscriptionId: subscription.id,
      planId: plan.id,
    })
    .where(eq(organizations.id, orgId));

  return subscription;
}

export async function cancelStripeSubscription(orgId: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org?.stripeSubscriptionId) {
    throw new Error("No active subscription found");
  }

  await stripe.subscriptions.cancel(org.stripeSubscriptionId);

  await db
    .update(organizations)
    .set({
      stripeSubscriptionId: null,
      planId: null,
    })
    .where(eq(organizations.id, orgId));
}

export async function createStripeCheckoutSession(
  orgId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
) {
  const [org, plan] = await Promise.all([
    db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    }),
    db.query.plans.findFirst({
      where: eq(plans.id, planId),
    }),
  ]);

  if (!org || !plan) {
    throw new Error("Organization or plan not found");
  }

  if (!plan.stripePriceId) {
    throw new Error("Plan is not configured with Stripe");
  }

  const customerId = await createStripeCustomer(orgId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId: org.id,
      planId: plan.id,
    },
  });

  return session;
}
