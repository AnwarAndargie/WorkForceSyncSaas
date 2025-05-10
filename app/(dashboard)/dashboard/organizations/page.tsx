import { Metadata } from "next";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { redirect } from "next/navigation";
import { getAllOrganizations } from "@/lib/db/queries/organizations";
import { getUser } from "@/lib/db/queries/users";

export const metadata: Metadata = {
  title: "Organizations",
  description: "Manage organizations and their plans",
};

export default async function OrganizationsPage() {
  const user = await getUser();

  // Check if the user exists and has the super_admin role
  if (!user || user.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Use the query function to get all organizations
  const data = await getAllOrganizations();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Organizations</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
