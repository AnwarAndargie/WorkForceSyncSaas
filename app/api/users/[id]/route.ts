import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { getUser } from "@/lib/db/queries/users";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get the current user
    const currentUser = await getUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow users to access their own data unless they are admins
    const isSelfAccess = currentUser.id === userId;
    const isAdmin = currentUser.role === "super_admin" || currentUser.role === "org_admin";
    
    if (!isSelfAccess && !isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized access to user data" },
        { status: 403 }
      );
    }

    // Get the requested user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Don't return sensitive information
    const { passwordHash, ...userWithoutSensitiveInfo } = user;
    
    return NextResponse.json(userWithoutSensitiveInfo);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { name, email, role, isActive } = body;

    // Get the current user
    const currentUser = await getUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow users to update their own data unless they are admins
    const isSelfUpdate = currentUser.id === userId;
    const isAdmin = currentUser.role === "super_admin" || currentUser.role === "org_admin";
    
    if (!isSelfUpdate && !isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized to update this user" },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Prevent role/status changes for self-updates by non-super-admins
    if (isSelfUpdate && currentUser.role !== "super_admin") {
      if (role && role !== currentUser.role) {
        return NextResponse.json(
          { message: "You cannot change your own role" },
          { status: 403 }
        );
      }
      
      if (isActive !== undefined && isActive !== currentUser.isActive) {
        return NextResponse.json(
          { message: "You cannot change your own active status" },
          { status: 403 }
        );
      }
    }

    // Only super_admin can create/promote to super_admin
    if (role === "super_admin" && currentUser.role !== "super_admin") {
      return NextResponse.json(
        { message: "Only super admins can create or promote to super admin role" },
        { status: 403 }
      );
    }

    // Prevent org_admin from changing role of users outside their organization
    if (
      currentUser.role === "org_admin" && 
      !isSelfUpdate &&
      existingUser.organizationId !== currentUser.organizationId
    ) {
      return NextResponse.json(
        { message: "You can only update users in your organization" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    
    // Only allow role changes by admins
    if (isAdmin && role !== undefined) {
      updateData.role = role;
    }
    
    // Only allow status changes by admins
    if (isAdmin && isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update the user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser || updatedUser.length === 0) {
      return NextResponse.json(
        { message: "Failed to update user" },
        { status: 500 }
      );
    }

    // Don't return sensitive information
    const { passwordHash, ...userWithoutSensitiveInfo } = updatedUser[0];
    
    return NextResponse.json(userWithoutSensitiveInfo);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get the current user
    const currentUser = await getUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins can delete users
    const isAdmin = currentUser.role === "super_admin" || 
                   (currentUser.role === "org_admin" && 
                    currentUser.organizationId === (await db.query.users.findFirst({
                      where: eq(users.id, userId),
                    }))?.organizationId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized to delete users" },
        { status: 403 }
      );
    }

    // Prevent deleting self
    if (currentUser.id === userId) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete the user
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (!deletedUser || deletedUser.length === 0) {
      return NextResponse.json(
        { message: "User not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
} 