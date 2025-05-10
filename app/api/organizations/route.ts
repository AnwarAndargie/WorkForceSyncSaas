import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // If user is a super admin, return all organizations
  if (user.role === "SUPER_ADMIN") {
    const orgs = await db.query.organizations.findMany();
    return NextResponse.json(orgs);
  }

  // Otherwise, return only the user's organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.organizationId),
  });

  if (!org) {
    return new NextResponse("Organization not found", { status: 404 });
  }

  return NextResponse.json([org]);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });

  if (!user || user.role !== "SUPER_ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (existingOrg) {
    return new NextResponse("Organization slug already exists", { status: 400 });
  }

  const org = await db
    .insert(organizations)
    .values({
      id: crypto.randomUUID(),
      name,
      slug,
    })
    .returning();

  return NextResponse.json(org[0]);
} 