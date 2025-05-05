import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/queries";

// GET all plans
export async function GET(req: NextRequest) {
  const plans = await db.getAllPlans();
  return NextResponse.json(plans);
}

// CREATE a new plan
export async function POST(req: NextRequest) {
  const body = await req.json();
  const newPlan = await db.createPlan(body);
  return NextResponse.json(newPlan, { status: 201 });
}
