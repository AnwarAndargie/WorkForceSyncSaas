import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { plans, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { stripe } from "@/lib/stripe";

// GET all available plans
export async function GET(req: NextRequest) {
  const currentUser = await getUser();

  // Check authentication
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allPlans = await db.query.plans.findMany();
    return NextResponse.json(allPlans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

// POST to create a new plan (super_admin only)
export async function POST(req: NextRequest) {
  const currentUser = await getUser();

  // Check authentication and authorization
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentUser.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, price, currency, description, features, stripePriceId } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Create the plan
    const newPlan = await db
      .insert(plans)
      .values({
        name,
        price,
        currency: currency || "usd",
        description,
        features: features || [],
        stripePriceId,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newPlan[0]);
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
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
