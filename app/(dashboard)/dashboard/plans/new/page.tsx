import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/queries/users";
import { PlanForm } from "../_components/plan-form";

export const metadata: Metadata = {
  title: "New Plan",
  description: "Create a new subscription plan",
};

export default async function NewPlanPage() {
  const user = await getUser();

  // Check if the user exists and has the super_admin role
  if (!user || user.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Create New Plan</h1>
      <PlanForm />
    </div>
  );
} 