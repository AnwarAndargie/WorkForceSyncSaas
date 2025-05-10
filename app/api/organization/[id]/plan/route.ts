import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { organizations, plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { updateOrganizationSubscription } from "@/lib/db/queries/organizations";

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
  const currentUser = await getUser();

  // Check authorization
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin or org_admin can update plan
  const isSuperAdmin = currentUser.role === "super_admin";
  const isOrgAdmin = currentUser.organizationId === params.id && currentUser.role === "org_admin";

  if (!isSuperAdmin && !isOrgAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Check if plan exists
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId),
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Check if plan is active
    if (!plan.isActive) {
      return NextResponse.json(
        { error: "Selected plan is not active" },
        { status: 400 }
      );
    }

    // Update organization's plan
    const updatedOrg = await db
      .update(organizations)
      .set({ planId })
      .where(eq(organizations.id, params.id))
      .returning();

    return NextResponse.json(updatedOrg[0]);

    // Note: In a real application, you would integrate with Stripe here
    // to create or update the subscription, and then update the organization
    // with the subscription details.
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
} 