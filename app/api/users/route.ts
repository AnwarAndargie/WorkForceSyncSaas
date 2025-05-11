import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/users";

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const currentUser = await getUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only super_admins and org_admins can list users
    if (currentUser.role !== "super_admin" && currentUser.role !== "org_admin") {
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch users based on role:
    // super_admin: all users
    // org_admin: users in their organization
    let allUsers;
    if (currentUser.role === "super_admin") {
      // Super admins can see all users
      allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)]
      });
    } else {
      // Org admins can only see users in their organization
      allUsers = await db.query.users.findMany({
        where: (users, { eq }) => eq(users.organizationId, currentUser.organizationId || ""),
        orderBy: (users, { desc }) => [desc(users.createdAt)]
      });
    }

    // Remove sensitive information
    const safeUsers = allUsers.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const currentUser = await getUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only super_admins and org_admins can create users
    if (currentUser.role !== "super_admin" && currentUser.role !== "org_admin") {
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, role, password, organizationId } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate role permissions
    if (role === "super_admin" && currentUser.role !== "super_admin") {
      return NextResponse.json(
        { message: "Only super admins can create super admin users" },
        { status: 403 }
      );
    }

    // If org_admin is creating a user, ensure they can only add to their own org
    if (currentUser.role === "org_admin") {
      if (organizationId && organizationId !== currentUser.organizationId) {
        return NextResponse.json(
          { message: "You can only add users to your own organization" },
          { status: 403 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email)
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await db.insert(users).values({
      email,
      name,
      passwordHash,
      role: role || "member",
      organizationId: organizationId || (currentUser.role === "org_admin" ? currentUser.organizationId : null),
      isActive: true
    }).returning();

    // Return the user without sensitive info
    const { passwordHash: _, ...safeUser } = newUser[0];

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
} 