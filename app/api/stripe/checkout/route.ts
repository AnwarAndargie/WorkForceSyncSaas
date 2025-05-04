import { eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle"; // Adjust path
import { users, organizations, team_members } from "@/lib/db/schema"; // Adjust path
import { setSession } from "@/lib/auth/session"; // Adjust path
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe"; // Adjust path
import Stripe from "stripe";
import {
  getUserById,
  getTeamForUser,
  updateOrganizationSubscription,
} from "@/lib/db/queries"; // Adjust path to queries.ts

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  try {
    // Retrieve Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "subscription"],
    });

    if (!session.customer || typeof session.customer === "string") {
      throw new Error("Invalid customer data from Stripe.");
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error("No subscription found for this session.");
    }

    // Retrieve subscription details
    const subscription = (await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    })) as Stripe.Subscription;

    const plan = subscription.items.data[0]?.price;
    if (!plan) {
      throw new Error("No plan found for this subscription.");
    }

    const priceId = plan.id; // Use price ID instead of product ID
    const subscriptionStatus = subscription.status;
    const currentPeriodEnd = subscription.current_period_end * 1000; // Convert to milliseconds

    // Get user ID from session
    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    // Fetch user
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found in database.");
    }

    // Fetch user's team to get organization ID
    const team = await getTeamForUser();
    if (!team || !team.organizationId) {
      throw new Error("User is not associated with any team or organization.");
    }

    // Update organization's subscription details
    await updateOrganizationSubscription(team.organizationId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionPriceId: priceId,
      stripeSubscriptionStatus: subscriptionStatus,
      stripeSubscriptionCurrentPeriodEnd: currentPeriodEnd,
    });

    // Set user session
    await setSession(user);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Error handling successful checkout:", error);
    // Optionally, pass error details in the redirect URL or use a custom error page
    const errorUrl = new URL("/error", request.url);
    errorUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.redirect(errorUrl);
  }
}
