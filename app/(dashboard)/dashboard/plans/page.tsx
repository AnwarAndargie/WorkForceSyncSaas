import { Metadata } from "next";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { redirect } from "next/navigation";
import { getAllPlans } from "@/lib/db/queries/plans";
import { getUser } from "@/lib/db/queries/users";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyPlaceholder } from "@/components/empty-placeholder";

export const metadata: Metadata = {
  title: "Plans",
  description: "Manage subscription plans for your SaaS",
};

export default async function PlansPage() {
  const user = await getUser();

  // Check if the user exists and has the super_admin role
  if (!user || user.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Use the query function to get all plans
  const data = await getAllPlans();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <Button asChild>
          <Link href="/dashboard/plans/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Plan
          </Link>
        </Button>
      </div>
      
      {data.length === 0 ? (
        <EmptyPlaceholder 
          title="No plans created"
          description="You don't have any subscription plans yet. Start by creating your first plan."
          action={
            <Button asChild>
              <Link href="/dashboard/plans/new">
                <Plus className="mr-2 h-4 w-4" /> Create First Plan
              </Link>
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
