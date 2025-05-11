import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, invitations } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/users";
import { v4 as uuidv4 } from "uuid";
import { and, eq } from "drizzle-orm";

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
    const { email, name, role = "member" } = body;
    
    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }
    
    // Check if the user already exists in the organization
    const existingUser = await db.query.users.findFirst({
      where: (users, { and, eq }) => 
        and(eq(users.email, email), eq(users.organizationId, params.id))
    });
    
    if (existingUser) {
      return NextResponse.json({
        error: "User with this email already exists in the organization"
      }, { status: 400 });
    }
    
    // Check if there's a pending invitation
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
      
      // TODO: Send invitation email with the invitation link
      
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
    
    // TODO: Send invitation email with the invitation link
    
    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation: newInvitation[0]
    });
  } catch (error: any) {
    console.error("[ORGANIZATION_INVITE_USER]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
} 