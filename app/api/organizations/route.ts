import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // If user is a super admin, return all organizations
  if (user.role === "super_admin") {
    const orgs = await db.query.organizations.findMany();
    return NextResponse.json(orgs);
  }

  // Otherwise, return only the user's organization
  if (!user.organizationId) {
    return new NextResponse("Organization not found", { status: 404 });
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.organizationId),
  });

  if (!org) {
    return new NextResponse("Organization not found", { status: 404 });
  }

  return NextResponse.json([org]);
}

export async function POST(req: Request) {
  const user = await getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.role !== "super_admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { name, subdomain } = body;

  if (!name || !subdomain) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.subdomain, subdomain),
  });

  if (existingOrg) {
    return new NextResponse("Organization subdomain already exists", { status: 400 });
  }

  const org = await db
    .insert(organizations)
    .values({
      name,
      subdomain,
      createdBy: user.id
    })
    .returning();

  return NextResponse.json(org[0]);
} 