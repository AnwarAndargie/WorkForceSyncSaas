import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { organizations, plans, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { createStripeSubscription } from "@/lib/stripe";
import { sendPlanUpdateEmail } from "@/lib/email/email-services";

// GET the current plan for an organization
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getUser();

  // Check authorization
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin or users in the organization can see plan
  const isSuperAdmin = currentUser.role === "super_admin";
  const isOrgMember = currentUser.organizationId === params.id;

  if (!isSuperAdmin && !isOrgMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, params.id),
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!organization.planId) {
      return NextResponse.json({ plan: null });
    }

    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, organization.planId),
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

// PUT to update an organization's plan
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUser();
    
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user is super_admin or an org_admin of the requested organization
    const hasPermission = 
      currentUser.role === "super_admin" || 
      (currentUser.role === "org_admin" && currentUser.organizationId === params.id);
    
    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const body = await req.json();
    const { planId } = body;
    
    if (!planId) {
      return new NextResponse("Plan ID is required", { status: 400 });
    }
    
    // Get the organization
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, params.id)
    });
    
    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }
    
    // Get the new plan
    const newPlan = await db.query.plans.findFirst({
      where: eq(plans.id, planId)
    });
    
    if (!newPlan) {
      return new NextResponse("Plan not found", { status: 404 });
    }
    
    // Get the current plan if exists
    let currentPlan = null;
    if (organization.planId) {
      currentPlan = await db.query.plans.findFirst({
        where: eq(plans.id, organization.planId)
      });
    }
    
    // Update the organization with the new plan and store the previous plan
    const updatedOrg = await db
      .update(organizations)
      .set({
        previousPlanId: organization.planId,
        planId,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, params.id))
      .returning();
    
    // If we're using Stripe and have a different plan, create a new subscription
    if (
      newPlan.stripePriceId && 
      (!organization.planId || organization.planId !== planId)
    ) {
      try {
        await createStripeSubscription(params.id, planId);
      } catch (stripeError) {
        console.error("Failed to update Stripe subscription", stripeError);
        
        // Revert the change if Stripe fails
        await db
          .update(organizations)
          .set({
            planId: organization.planId,
            previousPlanId: organization.previousPlanId,
            updatedAt: new Date()
          })
          .where(eq(organizations.id, params.id));
        
        return new NextResponse("Failed to update subscription with Stripe", { 
          status: 500 
        });
      }
    }
    
    // If plan was changed and both old and new plans exist, send email
    if (
      currentPlan && 
      organization.planId !== planId
    ) {
      // Get the organization admin
      const orgAdmin = await db.query.users.findFirst({
        where: (users, { and, eq }) => 
          and(
            eq(users.organizationId, params.id),
            eq(users.role, "org_admin")
          )
      });

      if (orgAdmin) {
        await sendPlanUpdateEmail(
          {
            id: orgAdmin.id,
            email: orgAdmin.email,
            name: orgAdmin.name || orgAdmin.email.split('@')[0]
          },
          {
            name: currentPlan.name
          },
          {
            name: newPlan.name,
            price: newPlan.price,
            currency: newPlan.currency || "usd"
          }
        );
      }
    }
    
    return NextResponse.json({
      message: "Plan updated successfully",
      organization: updatedOrg[0]
    });
    
  } catch (error: any) {
    console.error("[ORGANIZATION_UPDATE_PLAN]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
} 