"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function EditOrganizationPage() {
  const { id } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      console.log("Fetching organization with ID:", id);
      try {
        const res = await fetch(`/api/organization/${id}`);
        if (!res.ok) throw new Error("Failed to fetch organization.");
        const data = await res.json();
        setName(data.name);
        setSlug(data.slug);
      } catch (error) {
        console.error(error);
        alert("Failed to load organization.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrganization();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/organization/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) throw new Error("Update failed.");
      router.push("/organizations");
    } catch (error) {
      console.error(error);
      alert("Error updating organization.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  return (
    <div className=" mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Organization Data</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-orange-400 text-white hover:bg-orange-300 mt-3 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            "Update"
          )}
        </Button>
      </form>
    </div>
  );
}
