"use client";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { PlanForm } from "../_components/plans-form";
import { notFound } from "next/navigation";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";
import { Plan } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Edit Plan",
  description: "Edit a subscription plan",
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch user: ${res.status}`);
  }
  return res.json();
};

type EditPlanPageProps = {
  planId: string;
};

export default function EditPlanPage({ planId }: EditPlanPageProps) {
  const { data: plan } = useSWR<Plan>(
    `/api/subscription-plans/${planId}`,
    fetcher
  );

  // if (!plan) {
  //   notFound();
  // }
  console.log(plan);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Edit Plan</h1>
      <PlanForm plan={plan} />
    </div>
  );
}
