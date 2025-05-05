import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/queries";

// GET plan by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const plan = await db.getPlanById(params.id);
  if (!plan)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  return NextResponse.json(plan);
}

// UPDATE plan by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const updatedPlan = await db.updatePlan(params.id, body);
  return NextResponse.json(updatedPlan);
}

// DELETE plan by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.deletePlan(params.id);
  return NextResponse.json({ success: true });
}
