import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, invitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcrypt";

// GET users for an organization
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
    
    // Get all users from the organization
    const organizationUsers = await db.query.users.findMany({
      where: eq(users.organizationId, params.id),
    });
    
    return NextResponse.json(organizationUsers);
  } catch (error) {
    console.error("[ORGANIZATION_USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST to invite a user to an organization
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
    const { email, name, role = "member", password } = body;
    
    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }
    
    // Create a new user in the organization
    const newUser = await db.insert(users).values({
      email,
      name,
      role,
      organizationId: params.id,
      passwordHash: password ? await hash(password, 10) : undefined,
      isActive: true,
    }).returning();
    
    return NextResponse.json(newUser[0]);
  } catch (error) {
    console.error("[ORGANIZATION_USERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Mock function for hashing passwords
async function hashPassword(password: string): Promise<string> {
  // In a real app, use bcrypt or similar
  return `hashed_${password}`;
} 