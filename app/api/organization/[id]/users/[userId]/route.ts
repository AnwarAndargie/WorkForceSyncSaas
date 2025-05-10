import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, invitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";

// DELETE a user from an organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const currentUser = await getUser();

  // Check authorization
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin or org_admin can remove users
  const isSuperAdmin = currentUser.role === "super_admin";
  const isOrgAdmin = currentUser.organizationId === params.id && currentUser.role === "org_admin";

  if (!isSuperAdmin && !isOrgAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Check if user exists and belongs to the organization
    const userToRemove = await db.query.users.findFirst({
      where: and(
        eq(users.id, params.userId),
        eq(users.organizationId, params.id)
      ),
    });

    if (!userToRemove) {
      // Check if it's a pending invitation
      const invitation = await db.query.invitations.findFirst({
        where: and(
          eq(invitations.id, params.userId),
          eq(invitations.organizationId, params.id),
          eq(invitations.status, "pending")
        ),
      });

      if (invitation) {
        // Delete the invitation
        await db
          .delete(invitations)
          .where(eq(invitations.id, params.userId));
        
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { error: "User not found in this organization" },
        { status: 404 }
      );
    }

    // Cannot remove yourself
    if (userToRemove.id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    // Cannot remove super_admin
    if (userToRemove.role === "super_admin" && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot remove a super admin" },
        { status: 403 }
      );
    }

    // Remove user from organization by setting organizationId to null
    await db
      .update(users)
      .set({ organizationId: null })
      .where(eq(users.id, params.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json(
      { error: "Failed to remove user" },
      { status: 500 }
    );
  }
} 