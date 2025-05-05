"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // If using ShadCN
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // If using ShadCN

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch("/api/organization");
        if (!res.ok) {
          throw new Error("Failed to fetch organizations");
        }
        const data = await res.json();
        setOrganizations(data);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoading(false); // ensure loading is set to false even on failure
      }
    };

    fetchOrganizations();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/organization/${id}`, { method: "DELETE" });
    setOrganizations((prev) => prev.filter((org) => org.id !== id));
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/organizations/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-16 h-16 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Organizations</h1>

      {organizations.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-lg bg-gray-50 text-gray-500">
          No organizations found. Create one to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow border">
          <table className="min-w-full text-sm text-left table-auto">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">Slug</th>
                <th className="px-4 py-3 border-b">Created At</th>
                <th className="px-4 py-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{org.name}</td>
                  <td className="px-4 py-3 border-b">{org.slug}</td>
                  <td className="px-4 py-3 border-b">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 border-b space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(org.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(org.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
