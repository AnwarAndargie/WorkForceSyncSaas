"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateOrganizationDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subdomain }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create organization");
      }

      toast.success("Organization created successfully");
      setOpen(false);
      setName("");
      setSubdomain("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-400 text-white hover:bg-orange-300">
          <Plus className="mr-2 h-4 w-4" /> New Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage users and subscriptions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              placeholder="acme"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              This will be used for the organization's URL: subdomain.yourdomain.com
            </p>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-400 text-white hover:bg-orange-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 