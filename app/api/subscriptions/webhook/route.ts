import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db/drizzle";
import { organizations, plans, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { sendSubscriptionConfirmationEmail, sendPlanUpdateEmail } from "@/lib/email/email-services";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Error verifying webhook signature", error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    // Handle subscription events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the organization by Stripe customer ID
        const organization = await db.query.organizations.findFirst({
          where: eq(organizations.stripeCustomerId, subscription.customer as string),
        });

        if (!organization) {
          console.error("Organization not found for subscription", subscription.id);
          return new NextResponse("Organization not found", { status: 404 });
        }

        // Get the plan information
        const planId = organization.planId;
        if (!planId) {
          console.error("Plan ID not found for organization", organization.id);
          return new NextResponse("Plan not found", { status: 404 });
        }
        
        const plan = await db.query.plans.findFirst({
          where: eq(plans.id, planId)
        });

        if (!plan) {
          console.error("Plan not found with ID", planId);
          return new NextResponse("Plan not found", { status: 404 });
        }

        // Get the organization admin
        const orgAdmin = await db.query.users.findFirst({
          where: (users, { and, eq }) => 
            and(
              eq(users.organizationId, organization.id),
              eq(users.role, "org_admin")
            )
        });

        if (!orgAdmin) {
          console.error("No org admin found for organization", organization.id);
          return new NextResponse("Organization admin not found", { status: 404 });
        }

        if (event.type === "customer.subscription.created") {
          // Handle new subscription
          await sendSubscriptionConfirmationEmail(
            {
              id: orgAdmin.id,
              email: orgAdmin.email,
              name: orgAdmin.name || orgAdmin.email.split('@')[0]
            },
            {
              name: plan.name,
              price: plan.price,
              currency: plan.currency || "usd"
            }
          );
        } else if (event.type === "customer.subscription.updated") {
          // For subscription updates, we need the previous plan
          // This is a simplified approach - in production you might want to track the previous plan
          const previousPlanId = organization.previousPlanId;
          
          if (previousPlanId && previousPlanId !== planId) {
            const previousPlan = await db.query.plans.findFirst({
              where: eq(plans.id, previousPlanId)
            });

            if (previousPlan) {
              await sendPlanUpdateEmail(
                {
                  id: orgAdmin.id,
                  email: orgAdmin.email,
                  name: orgAdmin.name || orgAdmin.email.split('@')[0]
                },
                {
                  name: previousPlan.name
                },
                {
                  name: plan.name,
                  price: plan.price,
                  currency: plan.currency || "usd"
                }
              );
            }
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        // Handle subscription deletion if needed
        break;
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error handling webhook", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 