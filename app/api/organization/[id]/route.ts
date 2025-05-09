import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/queries/organizations";

// GET organization by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const org = await db.getOrganizationById(params.id);
  if (!org)
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  return NextResponse.json(org);
}

// UPDATE organization by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const updatedOrg = await db.updateOrganization(params.id, body);
  return NextResponse.json(updatedOrg);
}

// DELETE organization by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.deleteOrganization(params.id);
  return NextResponse.json({ success: true });
}
