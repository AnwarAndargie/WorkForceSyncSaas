import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { plans, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // If user is a super admin, return all plans
  if (user.role === "super_admin") {
    const allPlans = await db.query.plans.findMany();
    return NextResponse.json(allPlans);
  }

  // Otherwise, return only active plans
  const activePlans = await db.query.plans.findMany({
    where: eq(plans.isActive, true),
  });

  return NextResponse.json(activePlans);
}

export async function POST(req: Request) {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.role !== "super_admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { name, description, price, features } = body;

  if (!name || !price) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  // Create Stripe product and price
  const product = await stripe.products.create({
    name,
    description,
  });

  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: price,
    currency: "usd",
    recurring: {
      interval: "month",
    },
  });

  const plan = await db
    .insert(plans)
    .values({
      name,
      description,
      price,
      features,
      stripeProductId: product.id,
      stripePriceId: stripePrice.id,
    })
    .returning();

  return NextResponse.json(plan[0]);
}

export async function PATCH(req: Request) {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.role !== "super_admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { id, name, description, price, features, isActive } = body;

  if (!id) {
    return new NextResponse("Missing plan ID", { status: 400 });
  }

  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, id),
  });

  if (!plan) {
    return new NextResponse("Plan not found", { status: 404 });
  }

  // Update Stripe product if name or description changed
  if (plan.stripeProductId && (name || description)) {
    await stripe.products.update(plan.stripeProductId, {
      name: name || plan.name,
      description: description || plan.description,
    });
  }

  // Create new Stripe price if price changed
  let stripePriceId = plan.stripePriceId;
  if (plan.stripeProductId && price && price !== plan.price) {
    const stripePrice = await stripe.prices.create({
      product: plan.stripeProductId,
      unit_amount: price,
      currency: "usd",
      recurring: {
        interval: "month",
      },
    });
    stripePriceId = stripePrice.id;
  }

  const updatedPlan = await db
    .update(plans)
    .set({
      name: name || plan.name,
      description: description || plan.description,
      price: price || plan.price,
      features: features || plan.features,
      isActive: isActive ?? plan.isActive,
      stripePriceId,
    })
    .where(eq(plans.id, id))
    .returning();

  return NextResponse.json(updatedPlan[0]);
}
