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
import { useClients, Client } from "@/hooks/use-clients";
import { toast } from "sonner";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  mode: "create" | "edit";
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  mode,
}: ClientFormDialogProps) {
  const { createClient, updateClient, isCreating, isUpdating } = useClients();
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    address: "",
    adminId: "user_GmcahzgG79rBLJZUoQC4H", // Temporary user ID for testing
    tenantId: "tenant_f41b47a0699b4002adf85",
  });

  React.useEffect(() => {
    if (client && mode === "edit") {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        address: client.address || "",
        adminId: client.adminId || "user_GmcahzgG79rBLJZUoQC4H",
        tenantId: client.tenantId || "tenant_f41b47a0699b4002adf85",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        address: "",
        adminId: "user_GmcahzgG79rBLJZUoQC4H",
        tenantId: "tenant_f41b47a0699b4002adf85",
      });
    }
  }, [client, mode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast("client name is required");
      return;
    }

    try {
      if (mode === "create") {
        await createClient(formData);
        toast("client created successfully");
      } else if (client) {
        const { adminId, ...updateData } = formData;
        await updateClient(client.id, updateData);
        toast("client updated successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New client" : "Edit client"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new client to your system."
              : "Make changes to the client information."}
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
                placeholder="client name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="+251 ** ** ** ** **"
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
                placeholder="client address"
                rows={3}
              />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create client"
              ) : (
                "Update client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
