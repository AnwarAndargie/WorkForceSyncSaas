import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { invitations, organizations, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { z } from "zod";
import { sendInvitationEmail } from "@/lib/email/email-services";

export async function POST(
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
    
    // Validate input
    const inviteSchema = z.object({
      email: z.string().email(),
      role: z.enum(["org_admin", "member"]),
    });
    
    const { email, role } = inviteSchema.parse(body);
    
    // Check if user already exists in this organization
    const existingUser = await db.query.users.findFirst({
      where: (users, { and, eq }) => 
        and(
          eq(users.email, email),
          eq(users.organizationId, params.id)
        )
    });
    
    if (existingUser) {
      return new NextResponse("User already exists in this organization", { status: 400 });
    }

    // Get organization data
    const organization = await db.query.organizations.findFirst({
      where: (organizations, { eq }) => eq(organizations.id, params.id)
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }
    
    // Check if there's an existing pending invitation
    const existingInvitation = await db.query.invitations.findFirst({
      where: (invitations, { and, eq }) => 
        and(
          eq(invitations.invitedUserEmail, email),
          eq(invitations.organizationId, params.id),
          eq(invitations.status, "pending")
        )
    });
    
    // If there's an existing invitation, we'll update it
    if (existingInvitation) {
      const updatedInvitation = await db.update(invitations)
        .set({
          role,
          sentAt: new Date()
        })
        .where(
          and(
            eq(invitations.id, existingInvitation.id)
          )
        )
        .returning();
      
      // Send invitation email
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
    }
    
    // Create a new invitation
    const newInvitation = await db.insert(invitations)
      .values({
        organizationId: params.id,
        invitedUserEmail: email,
        role,
        status: "pending",
        sentAt: new Date()
      })
      .returning();
    
    // Send invitation email
    await sendInvitationEmail(
      newInvitation[0],
      {
        id: currentUser.id,
        name: currentUser.name || currentUser.email.split('@')[0]
      },
      {
        name: organization.name
      }
    );
    
    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation: newInvitation[0]
    });
  } catch (error: any) {
    console.error("[ORGANIZATION_INVITE_USER]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
} 