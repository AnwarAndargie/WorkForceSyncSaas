import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { createStripeCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const body = await req.json();
  const { planId } = body;

  if (!planId) {
    return new NextResponse("Missing plan ID", { status: 400 });
  }

  const checkoutSession = await createStripeCheckoutSession(
    user.organizationId,
    planId,
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`
  );

  return NextResponse.json({ url: checkoutSession.url });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.organizationId),
  });

  if (!org) {
    return new NextResponse("Organization not found", { status: 404 });
  }

  if (!org.stripeSubscriptionId) {
    return NextResponse.json({ subscription: null });
  }

  const subscription = await stripe.subscriptions.retrieve(
    org.stripeSubscriptionId
  );

  return NextResponse.json({ subscription });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });

  if (!user || user.role !== "ORG_ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.organizationId),
  });

  if (!org) {
    return new NextResponse("Organization not found", { status: 404 });
  }

  if (!org.stripeSubscriptionId) {
    return new NextResponse("No active subscription", { status: 400 });
  }

  await stripe.subscriptions.cancel(org.stripeSubscriptionId);

  await db
    .update(organizations)
    .set({
      stripeSubscriptionId: null,
      planId: null,
    })
    .where(eq(organizations.id, org.id));

  return new NextResponse(null, { status: 204 });
} 