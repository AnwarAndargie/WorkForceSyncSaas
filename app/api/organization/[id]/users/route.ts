import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, invitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { v4 as uuidv4 } from "uuid";

// GET users for an organization
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getUser();

  // Check authorization
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin or users in the organization can see users
  const isSuperAdmin = currentUser.role === "super_admin";
  const isOrgMember = currentUser.organizationId === params.id;
  const isOrgAdmin = isOrgMember && currentUser.role === "org_admin";

  if (!isSuperAdmin && !isOrgMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const orgUsers = await db.select().from(users).where(eq(users.organizationId, params.id));
    return NextResponse.json(orgUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST to invite a user to an organization
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getUser();

  // Check authorization
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin or org_admin can add users
  const isSuperAdmin = currentUser.role === "super_admin";
  const isOrgAdmin = currentUser.organizationId === params.id && currentUser.role === "org_admin";

  if (!isSuperAdmin && !isOrgAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, name, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      // If user exists but is not in this organization, update them
      if (existingUser.organizationId !== params.id) {
        const [updatedUser] = await db
          .update(users)
          .set({ organizationId: params.id, role: role || "member" })
          .where(eq(users.id, existingUser.id))
          .returning();
        
        return NextResponse.json(updatedUser);
      } else {
        return NextResponse.json(
          { error: "User already belongs to this organization" },
          { status: 400 }
        );
      }
    }

    // User doesn't exist, create an invitation
    const invitation = await db
      .insert(invitations)
      .values({
        id: uuidv4(),
        organizationId: params.id,
        invitedUserEmail: email,
        role: role || "member",
        status: "pending",
      })
      .returning();

    // Return a user-like object for the frontend
    return NextResponse.json({
      id: invitation[0].id,
      email,
      name: name || email.split("@")[0],
      role: role || "member",
      pending: true
    });
  } catch (error) {
    console.error("Error adding user:", error);
    return NextResponse.json(
      { error: "Failed to add user" },
      { status: 500 }
    );
  }
} 