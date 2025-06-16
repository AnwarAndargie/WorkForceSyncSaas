"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import { DataTable as BranchesTable } from "@/components/ui/data-table";

import { Trash, Pen, EyeIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBranches, Branch } from "@/hooks/use-branches";
import { BranchesFormDialog } from "./branches-form-dialog";

export const columns: ColumnDef<Branch>[] = [
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
    accessorKey: "name",
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
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => <div>{row.getValue("address") || "N/A"}</div>,
  },
  {
    accessorKey: "supervisorId",
    header: "Supervisor",
    cell: ({ row }) => (
      <div>{row.getValue("supervisorId") || "Not assigned"}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      return <div>{date ? new Date(date).toLocaleDateString() : "N/A"}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const branch = row.original;

      return (
        <>
          <BranchActions branch={branch} />
        </>
      );
    },
  },
];

function BranchActions({ branch }: { branch: Branch }) {
  const { deleteBranch, isDeleting } = useBranches();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this branch? This action cannot be undone."
      )
    ) {
      try {
        await deleteBranch(branch.id);
        alert("branch deleted successfully");
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to delete branch"
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
            onClick={() => navigator.clipboard.writeText(branch.id)}
          >
            Copy Branch ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pen className="mr-2 h-4 w-4" />
            Edit Branch
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Branch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BranchesFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        branch={branch}
        mode="edit"
      />
    </>
  );
}

export function BranchesClient() {
  const { branches, isLoading, error } = useBranches();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Manage Branches</h1>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Branch
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          You can manage your branches here.
        </p>
      </div>
      <div className="">
        <BranchesTable columns={columns} data={branches} />
        <BranchesFormDialog
          mode="create"
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </div>
  );
}
