import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/queries/organizations";

// GET all organizations
export async function GET(req: NextRequest) {
  const organizations = await db.getAllOrganizations();
  return NextResponse.json(organizations);
}

// CREATE a new organization
export async function POST(req: NextRequest) {
  const body = await req.json();
  const newOrg = await db.createOrganization(body);
  return NextResponse.json(newOrg, { status: 201 });
}
