"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { DataTable as CompanyTable } from "@/components/ui/data-table";

import { Trash, EyeIcon, Pen } from "lucide-react";
import { useCompanies, Company } from "@/hooks/use-companies";
import { CompanyFormDialog } from "./company-form-dialog";
import useSWR from "swr";
import { User } from "@/lib/db/schema";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch user: ${res.status}`);
  }
  return res.json();
};
interface Admin {
  id: string;
  name: string;
}

interface AdminsResponse {
  success: boolean;
  data: Admin[];
}
export const columns: ColumnDef<Company>[] = [
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
    header: "Name",
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
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
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return <div className="lowercase">{email || "-"}</div>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return <div>{phone || "-"}</div>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return <div className="max-w-[200px] truncate">{address || "-"}</div>;
    },
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
      return date ? new Date(date).toLocaleDateString() : "-";
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const company = row.original;

      return <CompanyActions company={company} />;
    },
  },
];

function CompanyActions({ company }: { company: Company }) {
  const { deleteCompany, isDeleting } = useCompanies();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this company? This action cannot be undone."
      )
    ) {
      try {
        await deleteCompany(company.id);
        alert("Company deleted successfully");
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to delete company"
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
            onClick={() => navigator.clipboard.writeText(company.id)}
          >
            Copy company ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pen className="mr-2 h-4 w-4" />
            Edit Company
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Company
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CompanyFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
        mode="edit"
      />
    </>
  );
}

export function CompanyClient() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const { companies, meta, isLoading, error } = useCompanies(page, 10, search);
  const { data: users } = useSWR<AdminsResponse>(
    "/api/users?role=tenant_admin",
    fetcher
  );

  if (!users) {
  }

  console.log(users);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-sm text-red-600">
            Error loading companies: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Companies</h1>
          <Button
            variant="outline"
            className="ml-auto mb-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Company
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your companies here. Total: {meta?.total || 0}
        </p>
      </div>

      <div className="flex items-center py-4">
        <CompanyTable columns={columns} data={companies} />
      </div>

      <CompanyFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
        users={users?.data}
      />
    </div>
  );
}
