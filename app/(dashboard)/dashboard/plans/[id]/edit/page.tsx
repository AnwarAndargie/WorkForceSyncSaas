import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/queries/users";
import { getPlanById } from "@/lib/db/queries/plans";
import { PlanForm } from "../../_components/plan-form";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Plan",
  description: "Edit a subscription plan",
};

interface EditPlanPageProps {
  params: {
    id: string;
  };
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
  const user = await getUser();

  // Check if the user exists and has the super_admin role
  if (!user || user.role !== "super_admin") {
    redirect("/dashboard");
  }

  const plan = await getPlanById(params.id);
  
  if (!plan) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Edit Plan</h1>
      <PlanForm plan={plan} />
    </div>
  );
} 