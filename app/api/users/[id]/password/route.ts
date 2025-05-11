import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { getUser } from "@/lib/db/queries/users";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get the current user
    const currentUser = await getUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow users to update their own password unless they are admins
    const isSelfUpdate = currentUser.id === userId;
    const isAdmin = currentUser.role === "super_admin" || currentUser.role === "org_admin";
    
    if (!isSelfUpdate && !isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized to update this user's password" },
        { status: 403 }
      );
    }

    // Get the user to update
    const userToUpdate = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userToUpdate) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // For self-updates, verify current password
    if (isSelfUpdate) {
      // Check if the current password is correct
      const isCorrectPassword = userToUpdate.passwordHash && 
        await bcrypt.compare(currentPassword, userToUpdate.passwordHash);

      if (!isCorrectPassword) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 400 }
        );
      }
    } else if (isAdmin) {
      // Admin reset - skip current password verification
      // Check for special admin reset value or if the user is a super_admin
      if (currentPassword !== "ADMIN_RESET" && currentUser.role !== "super_admin") {
        return NextResponse.json(
          { message: "Invalid admin reset code" },
          { status: 400 }
        );
      }
      
      // Org admins can only reset passwords for users in their org
      if (
        currentUser.role === "org_admin" && 
        userToUpdate.organizationId !== currentUser.organizationId
      ) {
        return NextResponse.json(
          { message: "You can only reset passwords for users in your organization" },
          { status: 403 }
        );
      }
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the password
    await db
      .update(users)
      .set({
        passwordHash,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { message: "Failed to update password" },
      { status: 500 }
    );
  }
} 