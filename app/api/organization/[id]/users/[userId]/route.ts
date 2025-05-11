import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, invitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";

// DELETE a user from an organization
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
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
    
    // Prevent deleting yourself
    if (params.userId === currentUser.id) {
      return new NextResponse("Cannot delete your own account", { status: 400 });
    }
    
    // Check if user exists in the organization
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, params.userId),
        eq(users.organizationId, params.id)
      ),
    });
    
    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Delete the user
    await db
      .delete(users)
      .where(
        and(
          eq(users.id, params.userId),
          eq(users.organizationId, params.id)
        )
      );
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ORGANIZATION_USER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string; userId: string } }
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
    
    // Get the user
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, params.userId),
        eq(users.organizationId, params.id)
      ),
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("[ORGANIZATION_USER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; userId: string } }
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
    const { name, role, isActive } = body;
    
    // Check if user exists in the organization
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, params.userId),
        eq(users.organizationId, params.id)
      ),
    });
    
    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Prevent changing role to super_admin unless current user is super_admin
    if (role === "super_admin" && currentUser.role !== "super_admin") {
      return new NextResponse("Cannot assign super_admin role", { status: 403 });
    }
    
    // Update the user
    const updatedFields: any = {};
    if (name !== undefined) updatedFields.name = name;
    if (role !== undefined) updatedFields.role = role;
    if (isActive !== undefined) updatedFields.isActive = isActive;
    
    const updatedUser = await db
      .update(users)
      .set(updatedFields)
      .where(
        and(
          eq(users.id, params.userId),
          eq(users.organizationId, params.id)
        )
      )
      .returning();
    
    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error("[ORGANIZATION_USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 