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
import { useEmployees, Employee } from "@/hooks/use-employees";

interface WorkeForceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  mode: "create" | "edit";
}

export function WorkForceFormDialog({
  open,
  onOpenChange,
  employee,
  mode,
}: WorkeForceFormDialogProps) {
  const { createEmployee, updateEmployee, isCreating, isUpdating } =
    useEmployees();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone_number: "",
    salary: 0,
    branchId: "", // Temporary user ID for testing
    tenantId: "tenant_f41b47a0699b4002adf85",
  });

  React.useEffect(() => {
    if (employee && mode === "edit") {
      setFormData({
        name: employee.name || "",
        phone_number: employee.phone_number || "",
        email: employee.email || "",
        salary: employee.salary,
        branchId: employee.branchId || "",
        tenantId: employee.tenantId || "tenant_f41b47a0699b4002adf85",
      });
    } else {
      setFormData({
        name: "",
        phone_number: "",
        email: "",
        salary: 0,
        branchId: "",
        tenantId: "tenant_f41b47a0699b4002adf85",
      });
    }
  }, [employee, mode]);

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
        await createEmployee(formData);
        toast("employee created successfully");
      } else if (employee) {
        const { branchId, ...updateData } = formData;
        await updateEmployee(employee.id, updateData);
        toast("employee updated successfully");
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
            {mode === "create" ? "Create New employee" : "Edit employee"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new employee to your system."
              : "Make changes to the employee information."}
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
                placeholder="employee name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email*
              </Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
                type="email"
                placeholder="employee email"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone_number"
                value={formData.phone}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="+251 ** ** ** ** **"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Salarry
              </Label>
              <Input
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                type="number"
                className="col-span-3"
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
                "Create employee"
              ) : (
                "Update employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
