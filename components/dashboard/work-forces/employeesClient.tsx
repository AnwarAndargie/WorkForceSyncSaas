"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { DataTable as EmployeeTable } from "@/components/ui/data-table";
import { Trash, Pen, EyeIcon } from "lucide-react";
import { useEmployees, Employee } from "@/hooks/use-employees";
import { WorkForceFormDialog } from "./work-force-dialog";
import { Loader2 } from "lucide-react";

export const columns: ColumnDef<Employee>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "userName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      );
    },
  },
  {
    accessorKey: "userEmail",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("userEmail")}</div>
    ),
  },
  {
    accessorKey: "userPhone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("userPhone")}</div>
    ),
  },
  {
    accessorKey: "salary",
    header: () => <div className="text-right">Salary</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("salary"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ETB",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "branchName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Branch
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const branchName = row.getValue("branchName")
        ? `${row.getValue("branchName")}`
        : "Not Assigned";

      return <div>{branchName}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const employee = row.original;

      return (
        <>
          <EmployeeActions employee={employee} />
        </>
      );
    },
  },
];
function EmployeeActions({ employee }: { employee: Employee }) {
  const { deleteEmployee, isDeleting } = useEmployees();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this employee? This action cannot be undone."
      )
    ) {
      try {
        await deleteEmployee(employee.id);
        alert("employee deleted successfully");
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to delete employee"
        );
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(employee.id)}
          >
            Copy employee ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pen className="mr-2 h-4 w-4" />
            Edit employee
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete employee
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkForceFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        employee={employee}
        mode="edit"
      />
    </>
  );
}

export function WorkForceClient() {
  const { employees, isLoading, error } = useEmployees();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  console.log(employees);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
        <span className="ml-2">Loading employees...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <p>{error}</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workforce efficiently.
          </p>
        </div>
        <div>
          <Button
            className="mt-4 cursor-pointer "
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
          >
            Add New Employee
          </Button>
        </div>
      </div>
      <div>
        <EmployeeTable data={employees} columns={columns} />
        <WorkForceFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          mode="create"
        />
      </div>
    </div>
  );
}
