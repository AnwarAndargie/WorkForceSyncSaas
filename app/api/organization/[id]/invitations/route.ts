import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { invitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";

// GET invitations for an organization
export async function GET(
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
    
    // Get all invitations for the organization
    const organizationInvitations = await db.query.invitations.findMany({
      where: eq(invitations.organizationId, params.id),
    });
    
    return NextResponse.json(organizationInvitations);
  } catch (error) {
    console.error("[ORGANIZATION_INVITATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 