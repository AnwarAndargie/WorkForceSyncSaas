import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new NextResponse("No signature", { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new NextResponse(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 400 }
    );
  }

  const session = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed": {
      const { organizationId, planId } = session.metadata;

      await db
        .update(organizations)
        .set({
          stripeSubscriptionId: session.subscription,
          planId,
        })
        .where(eq(organizations.id, organizationId));

      break;
    }

    case "customer.subscription.updated": {
      const { organizationId } = session.metadata;

      await db
        .update(organizations)
        .set({
          stripeSubscriptionId: session.id,
        })
        .where(eq(organizations.id, organizationId));

      break;
    }

    case "customer.subscription.deleted": {
      const { organizationId } = session.metadata;

      await db
        .update(organizations)
        .set({
          stripeSubscriptionId: null,
          planId: null,
        })
        .where(eq(organizations.id, organizationId));

      break;
    }
  }

  return new NextResponse(null, { status: 200 });
} 