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
import { useClients, Client } from "@/hooks/use-clients";
import { useSession } from "@/hooks/useSession";
import useSWR from "swr";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  mode: "create" | "edit";
}

interface Admin {
  id: string;
  name: string;
}

interface AdminsResponse {
  success: boolean;
  data: Admin[];
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.status}`);
  }
  const json = await response.json();
  return json.data || json; // Handle { success, data } or plain array
};

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  mode,
}: ClientFormDialogProps) {
  const { createClient, updateClient, isCreating, isUpdating } = useClients();
  const { data: user, isLoading: sessionLoading } = useSession();
  const {
    data: adminsData,
    error: adminsError,
    isLoading: adminsLoading,
  } = useSWR<AdminsResponse>(
    user?.tenantId
      ? `/api/users?tenantId=${user?.tenantId}&role=client_admin`
      : null,
    fetcher
  );

  console.log(adminsData);

  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    address: "",
    adminId: "",
    tenantId: "",
  });

  // Ensure admins is always an array
  const admins = React.useMemo(() => {
    if (!adminsData) return [];
    return Array.isArray(adminsData.data) ? adminsData.data : [];
  }, [adminsData]);

  React.useEffect(() => {
    console.log(
      "Admins Data:",
      adminsData,
      "Error:",
      adminsError,
      "Loading:",
      adminsLoading
    );
    if (client && mode === "edit") {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        address: client.address || "",
        adminId: client.adminId || "",
        tenantId: client.tenantId || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        address: "",
        adminId: admins.length === 1 && !adminsLoading ? admins[0].id : "",
        tenantId: user?.tenantId || "",
      });
    }
  }, [client, mode, user?.tenantId, admins, adminsLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast("Client name is required");
      return;
    }
    if (!formData.phone.trim()) {
      toast("Client phone is required");
      return;
    }
    if (!formData.tenantId) {
      toast("Tenant ID is required");
      return;
    }

    try {
      if (mode === "create") {
        await createClient(formData);
        toast("Client created successfully");
      } else if (client) {
        await updateClient(client.id, formData);
        toast("Client updated successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const isLoading = isCreating || isUpdating || sessionLoading || adminsLoading;

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
            {mode === "create" ? "Create New Client" : "Edit Client"}
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
                placeholder="Client name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone *
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="+251 ** ** ** ** **"
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
                placeholder="Client address"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adminId" className="text-right">
                Admin
              </Label>
              <Select
                value={formData.adminId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, adminId: value }))
                }
                name="adminId"
                disabled={admins.length === 0 || adminsError || adminsLoading}
              >
                <SelectTrigger className="col-span-3" id="adminId">
                  <SelectValue
                    placeholder={
                      adminsLoading
                        ? "Loading admins..."
                        : admins.length === 0
                          ? "No admins available"
                          : "Select an admin"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name}
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
            <Button type="submit" disabled={isLoading || adminsError}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Client"
              ) : (
                "Update Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
