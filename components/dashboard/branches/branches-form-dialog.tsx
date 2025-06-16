"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useBranches, Branch } from "@/hooks/use-branches";
import { useSession } from "@/hooks/useSession";
import useSWR from "swr";

interface BranchesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  mode: "create" | "edit";
}

interface Client {
  id: string;
  name: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.status}`);
  }
  const json = await response.json();
  return Array.isArray(json) ? json : json.data || [];
};

export function BranchesFormDialog({
  open,
  onOpenChange,
  branch,
  mode,
}: BranchesFormDialogProps) {
  const { createBranch, updateBranch, isCreating, isUpdating } = useBranches();
  const { data: user, isLoading: sessionLoading } = useSession();

  const {
    data: clientsData,
    error: clientsError,
    isLoading: clientsLoading,
  } = useSWR<Client[]>(
    user?.tenantId ? `/api/clients?tenantId=${user?.tenantId}` : null,
    fetcher
  );

  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    clientId: "",
  });

  // Ensure clients are always an array
  const clients = React.useMemo(() => {
    return Array.isArray(clientsData) ? clientsData : [];
  }, [clientsData]);

  React.useEffect(() => {
    if (branch && mode === "edit") {
      setFormData({
        name: branch.name || "",
        address: branch.address || "",
        clientId: branch.clientId || "",
      });
    } else {
      setFormData({
        name: "",
        address: "",
        clientId:
          user?.clientId ||
          (clients.length === 1 && !clientsLoading ? clients[0].id : ""),
      });
    }
  }, [branch, mode, user?.clientId, clients, clientsLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast("Branch name is required");
      return;
    }
    if (!formData.clientId) {
      toast("Client is required");
      return;
    }

    try {
      if (mode === "create") {
        await createBranch(formData);
        toast("Branch created successfully");
      } else if (branch) {
        await updateBranch(branch.id, formData);
        toast("Branch updated successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const isLoading =
    isCreating || isUpdating || sessionLoading || clientsLoading;

  if (sessionLoading) {
    return <div>Loading session...</div>;
  }

  if (!user) {
    return <div className="text-center">Please log in to continue.</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Branch" : "Edit Branch"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new branch to your system."
              : "Make changes to the branch information."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Branch name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Branch address"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId" className="text-right">
                Client *
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, clientId: value }))
                }
                name="clientId"
                disabled={
                  clients.length === 0 || clientsError || clientsLoading
                }
              >
                <SelectTrigger className="col-span-3" id="clientId">
                  <SelectValue
                    placeholder={
                      clientsLoading
                        ? "Loading clients..."
                        : clients.length === 0
                          ? "No clients available"
                          : "Select a client"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || clientsError}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Branch"
              ) : (
                "Update Branch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
