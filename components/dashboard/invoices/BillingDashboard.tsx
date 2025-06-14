"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InvoiceItem {
  id: string;
  date: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
}

const invoiceItems: InvoiceItem[] = [
  {
    id: "INV-001",
    date: "May 1, 2023",
    amount: "$99.00",
    status: "Paid",
  },
  {
    id: "INV-002",
    date: "Apr 1, 2023",
    amount: "$99.00",
    status: "Paid",
  },
  {
    id: "INV-003",
    date: "Mar 1, 2023",
    amount: "$99.00",
    status: "Paid",
  },
  {
    id: "INV-004",
    date: "Feb 1, 2023",
    amount: "$99.00",
    status: "Paid",
  },
  {
    id: "INV-005",
    date: "Jan 1, 2023",
    amount: "$99.00",
    status: "Paid",
  },
];

export function BillingDashboard() {
  const getStatusColor = (status: InvoiceItem["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the Pro plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plan</span>
                <Badge className="bg-orange-100 text-orange-800">Pro</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price</span>
                <span>$99/month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Billing Cycle</span>
                <span>Monthly</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next Invoice</span>
                <span>June 1, 2023</span>
              </div>
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-500">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-16 rounded-md bg-gray-100 p-2">
                  <CreditCard className="h-full w-full text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Visa ending in 4242</p>
                  <p className="text-xs text-gray-500">Expires 12/2024</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Monitor your resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">API Calls</span>
                  <span className="text-sm text-gray-500">14,352 / 20,000</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-full w-[70%] rounded-full bg-orange-500"></div>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-sm text-gray-500">5.2GB / 10GB</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-full w-[52%] rounded-full bg-orange-500"></div>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Users</span>
                  <span className="text-sm text-gray-500">8 / 10</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-full w-[80%] rounded-full bg-orange-500"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Billing History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
