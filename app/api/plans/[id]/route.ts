import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/queries/plans";
import { db as drizzleDb } from "@/lib/db/drizzle";
import { plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { stripe } from "@/lib/stripe";
import { getPlanById, updatePlan, deletePlan } from "@/lib/db/queries/plans";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET plan by ID
export async function GET(request: Request, { params }: RouteParams) {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const plan = await getPlanById(params.id);

  if (!plan) {
    return new NextResponse("Plan not found", { status: 404 });
  }

  return NextResponse.json(plan);
}

// UPDATE plan by ID
export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.role !== "super_admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const { name, description, price, features, isActive, currency } = body;

  if (!params.id) {
    return new NextResponse("Missing plan ID", { status: 400 });
  }

  const plan = await getPlanById(params.id);

  if (!plan) {
    return new NextResponse("Plan not found", { status: 404 });
  }

  // Create or update Stripe price if price changed or doesn't exist
  let stripePriceId = plan.stripePriceId;
  if ((!stripePriceId || price !== plan.price) && price) {
    // If no Stripe product yet, create one
    let stripeProduct;
    
    try {
      // Create a new Stripe product
      stripeProduct = await stripe.products.create({
        name: name || plan.name,
        description: description || plan.description || '',
      });
      
      // Create a price for the product
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: price,
        currency: currency || plan.currency || 'usd',
        recurring: {
          interval: "month",
        },
      });
      
      stripePriceId = stripePrice.id;
    } catch (error) {
      console.error("Stripe error:", error);
      return new NextResponse("Error creating Stripe product/price", { 
        status: 500 
      });
    }
  }

  const updatedPlan = await updatePlan(params.id, {
    name: name || plan.name,
    description: description !== undefined ? description : plan.description,
    price: price || plan.price,
    features: features || plan.features,
    isActive: isActive !== undefined ? isActive : plan.isActive,
    stripePriceId,
    currency: currency || plan.currency,
  });

  return NextResponse.json(updatedPlan);
}

// DELETE plan by ID
export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.role !== "super_admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const plan = await getPlanById(params.id);

  if (!plan) {
    return new NextResponse("Plan not found", { status: 404 });
  }

  // If the plan has a Stripe price ID, archive it in Stripe
  if (plan.stripePriceId) {
    try {
      // Get the product ID from the price
      const price = await stripe.prices.retrieve(plan.stripePriceId);
      if (price.product) {
        // Archive the product
        await stripe.products.update(price.product as string, {
          active: false,
        });
      }
    } catch (error) {
      console.error("Stripe error:", error);
      // Continue with deletion even if Stripe fails
    }
  }

  // Delete the plan from the database
  await deletePlan(params.id);

  return new NextResponse(null, { status: 204 });
}
