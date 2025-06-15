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
import { Company, useCompanies } from "@/hooks/use-companies";
import { toast } from "sonner";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  mode: "create" | "edit";
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  mode,
}: CompanyFormDialogProps) {
  const { createCompany, updateCompany, isCreating, isUpdating } =
    useCompanies();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logo: "",
    ownerId: "user_GmcahzgG79rBLJZUoQC4H", // Temporary user ID for testing
  });

  React.useEffect(() => {
    if (company && mode === "edit") {
      setFormData({
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        logo: company.logo || "",
        ownerId: company.ownerId || "user_GmcahzgG79rBLJZUoQC4H",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        logo: "",
        ownerId: "user_GmcahzgG79rBLJZUoQC4H",
      });
    }
  }, [company, mode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast("Company name is required");
      return;
    }

    try {
      if (mode === "create") {
        await createCompany(formData);
        toast("Company created successfully");
      } else if (company) {
        const { ownerId, ...updateData } = formData;
        await updateCompany(company.id, updateData);
        toast("Company updated successfully");
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
            {mode === "create" ? "Create New Company" : "Edit Company"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new company to your system."
              : "Make changes to the company information."}
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
                placeholder="Company name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="company@example.com"
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
                placeholder="+1 (555) 123-4567"
              />
            </div>
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Owner Id
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.ownerId}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="+1 (555) 123-4567"
              />
            </div> */}
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
                placeholder="Company address"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logo" className="text-right">
                Logo URL
              </Label>
              <Input
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="https://example.com/logo.png"
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
                "Create Company"
              ) : (
                "Update Company"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
