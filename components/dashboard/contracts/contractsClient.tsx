"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { DataTable as ContractsTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return res.json();
  });

export interface ContractsResponse {
  id: string;
  tenantId: string;
  tenantName: string;
  clientId: string;
  clientName: string;
  startDate: string; // API returns ISO string
  endDate: string | null;
  terms: string | null;
  status: "active" | "expired" | "terminated";
}

export const columns: ColumnDef<ContractsResponse>[] = [
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Company Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("tenantName")}</div>
    ),
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Client Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("clientName")}</div>
    ),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start Date
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div>{new Date(row.getValue("startDate")).toLocaleDateString()}</div>
    ),
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        End Date
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        {row.getValue("endDate")
          ? new Date(row.getValue("endDate")).toLocaleDateString()
          : "Not determined"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
];

export default function ContractsPage() {
  const { data: user, error: userError } = useSWR<SessionUser>(
    "/api/user",
    fetcher
  );
  const { data: contracts, error: contractsError } = useSWR<
    ContractsResponse[]
  >(`/api/contracts`, fetcher);

  if (userError || contractsError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {userError?.message || contractsError?.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!user || !contracts) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  if (user.role === "client_admin") {
    const contract = contracts.find((c) => c.clientId === user.clientId);
    if (!contract) {
      return (
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold mb-4">Your Contract</h1>
          <Alert>
            <AlertDescription>No active contract found.</AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Your Contract</h1>
        <Card>
          <CardHeader>
            <CardTitle>
              {contract.tenantName} - {contract.clientName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Start Date:</strong>{" "}
              {new Date(contract.startDate).toLocaleDateString()}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {contract.endDate
                ? new Date(contract.endDate).toLocaleDateString()
                : "Not determined"}
            </p>
            <p>
              <strong>Status:</strong> {contract.status}
            </p>
            <p>
              <strong>Terms:</strong> {contract.terms || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Contracts</h1>
        <p className="text-sm text-muted-foreground">
          View your contracts here.
        </p>
      </div>
      <ContractsTable columns={columns} data={contracts} />
    </div>
  );
}
