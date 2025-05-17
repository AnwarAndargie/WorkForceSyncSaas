"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Building,
  Briefcase,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  

  // Mock data for dashboard metrics
  const dashboardMetrics = {
    totalClients: 24,
    activeContracts: 18,
    pendingInvoices: 7,
    totalEmployees: 32,
    activeAssignments: 45,
    completedAssignments: 178,
    missedShifts: 3,
    upcomingShifts: 12,
  };

  const user = {
    name: "Anwar",
    role: "super_admin",
  };
  const isSuperAdmin = user.role === "super_admin";
  const isOrgAdmin = user.role === "org_admin";
  const isMember = user.role === "member";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your workforce today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isOrgAdmin || isSuperAdmin) && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics.totalClients}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +2 this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Active Contracts
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics.activeContracts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  3 renewing soon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Pending Invoices
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics.pendingInvoices}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  $12,450 total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Employees
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics.totalEmployees}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +5 this quarter
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Active Assignments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardMetrics.activeAssignments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {isMember ? "3 clients" : "8 branches"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardMetrics.completedAssignments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Missed Shifts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardMetrics.missedShifts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Upcoming Shifts
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardMetrics.upcomingShifts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Next 48 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest assignments and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    New assignment at ABC Corporation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cleaning service - Main Branch
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">1 hour ago</div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Shift completed at XYZ Industries
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Security service - Downtown Office
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">Yesterday</div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Client feedback received
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ⭐⭐⭐⭐⭐ for Maintenance service
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Notifications</CardTitle>
            <CardDescription>
              Alerts and updates requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Contract renewal required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Global Tech Services - Expires in 7 days
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-500"
                >
                  Upcoming
                </Badge>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">Missed shift report</p>
                  <p className="text-xs text-muted-foreground">
                    Security detail at First Bank - May 15, 2023
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-red-500 text-red-500"
                >
                  Urgent
                </Badge>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">New client onboarding</p>
                  <p className="text-xs text-muted-foreground">
                    Pending approvals for Metro Office Solutions
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-blue-500 text-blue-500"
                >
                  New
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
