import { Metadata } from "next";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { redirect } from "next/navigation";
import { getAllOrganizations } from "@/lib/db/queries/organizations";
import { getUser } from "@/lib/db/queries/users";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { Organization } from "@/lib/db/schema";
import { getPlanById } from "@/lib/db/queries/plans";

export const metadata: Metadata = {
  title: "Organizations",
  description: "Manage organizations and their plans",
};

interface OrganizationWithPlanName extends Organization {
  planName: string;
}

export default async function OrganizationsPage() {
  const user = await getUser();

  // Check if the user exists and has the super_admin role
  if (!user || user.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Use the query function to get all organizations
  const data = await getAllOrganizations();
  const organizationsWithPlanName: OrganizationWithPlanName[] =
    await Promise.all(
      data.map(async (org: any) => {
        const plan = await getPlanById(org.planId);
        return {
          ...org,
          planName: plan?.name || "Free",
        };
      })
    );

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <CreateOrganizationDialog />
      </div>
      <DataTable columns={columns} data={organizationsWithPlanName} />
    </div>
  );
}
