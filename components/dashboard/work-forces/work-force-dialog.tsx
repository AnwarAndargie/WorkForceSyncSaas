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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEmployees, Employee } from "@/hooks/use-employees";
import useSWR from "swr";
import { useSession } from "@/hooks/useSession";
import { Branch } from "@/lib/db/schema";

interface EmployeeResponse {
  id: string;
  userId: string;
  tenantId: string;
  branchId: string;
  branchName: string;
  name: string;
  userEmail: string;
  userPhone: string;
  tenantName: string;
  salary: number;
}

interface WorkForceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeResponse | null;
  mode: "create" | "edit";
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return res.json();
  });

export function WorkForceFormDialog({
  open,
  onOpenChange,
  employee,
  mode,
}: WorkForceFormDialogProps) {
  const { createEmployee, updateEmployee, isCreating, isUpdating } =
    useEmployees();
  const { data: user } = useSession();
  console.log(employee);
  const {
    data: branchesData,
    error: branchesError,
    isLoading: branchesLoading,
  } = useSWR<Branch[]>(
    user?.tenantId ? `/api/branches?tenantId=${user?.tenantId}` : null,
    fetcher
  );

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone_number: "",
    salary: 0,
    branchId: "",
    tenantId: "",
  });

  // Ensure branches is always an array
  const branches = React.useMemo(() => {
    return Array.isArray(branchesData) ? branchesData : [];
  }, [branchesData]);

  React.useEffect(() => {
    if (employee && mode === "edit") {
      setFormData({
        name: employee.name || "",
        email: employee.userEmail || "",
        phone_number: employee.userPhone || "",
        salary: employee.salary || 0,
        branchId: employee.branchId || "",
        tenantId: employee.tenantId || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        salary: 0,
        branchId:
          branches.length === 1 && !branchesLoading ? branches[0].id : "",
        tenantId: user?.tenantId || "",
      });
    }
  }, [employee, mode, user?.tenantId, branches, branchesLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "salary" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast("Employee name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast("Employee email is required");
      return;
    }
    if (!formData.phone_number.trim()) {
      toast("Employee phone number is required");
      return;
    }
    if (isNaN(formData.salary) || formData.salary < 0) {
      toast("Salary must be a non-negative number");
      return;
    }
    if (!formData.tenantId) {
      toast("Tenant ID is required");
      return;
    }

    try {
      if (mode === "create") {
        await createEmployee(formData);
        toast("Employee created successfully");
      } else if (employee) {
        await updateEmployee(employee.id, formData);
        toast("Employee updated successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const isLoading = isCreating || isUpdating || branchesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Employee" : "Edit Employee"}
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
                placeholder="Employee name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
                type="email"
                placeholder="Employee email"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                Phone *
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="+251 ** ** ** ** **"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salary" className="text-right">
                Salary *
              </Label>
              <Input
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                type="number"
                className="col-span-3"
                min="0"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branchId" className="text-right">
                Branch
              </Label>
              <Select
                // id="branchId"
                name="branchId"
                value={formData.branchId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, branchId: value }))
                }
                disabled={
                  branches.length === 0 || !!branchesError || branchesLoading
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={"Select a branch"} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
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
            <Button
              type="submit"
              disabled={isLoading || branchesError || branchesLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-t-foreground" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Employee"
              ) : (
                "Update Employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default WorkForceFormDialog;
