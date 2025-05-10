import { Metadata } from "next";
import { db } from "@/lib/db/drizzle";
import { organizations } from "@/lib/db/schema";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Organizations",
  description: "Manage organizations and their plans",
};

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "super_admin") {
    redirect("/dashboard");
  }

  const data = await db.query.organizations.findMany({
    with: {
      plan: true,
      users: true,
    },
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Organizations</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
