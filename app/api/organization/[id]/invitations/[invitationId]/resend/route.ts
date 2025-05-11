import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { invitations, organizations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { sendInvitationEmail } from "@/lib/email/email-services";

// POST to resend invitation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
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
    
    // Check if invitation exists
    const invitation = await db.query.invitations.findFirst({
      where: (invitations, { and, eq }) => 
        and(
          eq(invitations.id, params.invitationId),
          eq(invitations.organizationId, params.id),
          eq(invitations.status, "pending")
        )
    });
    
    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 });
    }
    
    // Get organization data
    const organization = await db.query.organizations.findFirst({
      where: (organizations, { eq }) => eq(organizations.id, params.id)
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }
    
    // Update the invitation's sent timestamp
    const updatedInvitation = await db
      .update(invitations)
      .set({
        sentAt: new Date()
      })
      .where(
        and(
          eq(invitations.id, params.invitationId),
          eq(invitations.status, "pending")
        )
      )
      .returning();
    
    if (!updatedInvitation.length) {
      return new NextResponse("Failed to update invitation", { status: 500 });
    }
    
    // Send the invitation email
    await sendInvitationEmail(
      updatedInvitation[0],
      {
        id: currentUser.id,
        name: currentUser.name || currentUser.email.split('@')[0]
      },
      {
        name: organization.name
      }
    );
    
    return NextResponse.json({
      message: "Invitation resent successfully",
      invitation: updatedInvitation[0]
    });
  } catch (error: any) {
    console.error("[INVITATION_RESEND]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
} 