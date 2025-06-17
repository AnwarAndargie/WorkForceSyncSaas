"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  DollarSign,
  Briefcase,
  UserPlus,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return res.json().then((json) => json.data || json);
  });

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-orange-100 p-1.5 text-orange-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && trendValue && (
          <div className="mt-2 flex items-center text-xs">
            <span
              className={trend === "up" ? "text-green-600" : "text-red-600"}
            >
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardData {
  tenants?: number;
  clients?: number;
  revenue?: string;
  employees?: number;
  supervisors?: number;
  branches?: number;
  plan?: { id: string; name: string; status: string };
}

export default function DashboardPage() {
  const { data: user, error: userError } = useSWR<SessionUser>(
    "/api/user",
    fetcher
  );
  const { data: dashboardData, error: dashboardError } = useSWR<DashboardData>(
    "/api/dashboard-metrics",
    fetcher
  );

  if (userError || dashboardError) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-red-50 text-red-600">
          <CardContent className="pt-6">
            Error loading dashboard data
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Calculate trends (simplified, adjust with historical data if available)
  const getTrend = (value: number, prevValue: number) => {
    if (prevValue === 0) return null;
    const change = ((value - prevValue) / prevValue) * 100;
    return {
      trend: change >= 0 ? "up" : "down",
      trendValue: `${Math.abs(change).toFixed(1)}%`,
    };
  };

  const tenantTrend = dashboardData.tenants
    ? getTrend(dashboardData.tenants, dashboardData.tenants - 1)
    : null;
  const clientTrend = dashboardData.clients
    ? getTrend(dashboardData.clients, dashboardData.clients - 1)
    : null;
  const revenueTrend = dashboardData.revenue
    ? getTrend(parseFloat(dashboardData.revenue.replace("$", "")), 1000)
    : null;
  const employeeTrend = dashboardData.employees
    ? getTrend(dashboardData.employees, dashboardData.employees - 1)
    : null;
  const supervisorTrend = dashboardData.supervisors
    ? getTrend(dashboardData.supervisors, dashboardData.supervisors - 1)
    : null;
  const branchTrend = dashboardData.branches
    ? getTrend(dashboardData.branches, dashboardData.branches - 1)
    : null;

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome, {user.name || "User"}!
            </h2>
            <p className="text-sm">
              {user.role === "super_admin"
                ? "Manage all tenants and plans effectively."
                : user.role === "tenant_admin"
                  ? "Oversee your clients and contracts."
                  : "Manage your branches and contracts."}
            </p>
          </div>
          <Star className="h-12 w-12 opacity-50" />
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {user.role === "super_admin" && (
          <>
            <StatCard
              title="Tenants"
              value={dashboardData.tenants || 0}
              description="Total companies"
              icon={<Building2 className="h-5 w-5" />}
              // trend={tenantTrend?.trend}
              trendValue={tenantTrend?.trendValue}
            />
            <StatCard
              title="Clients"
              value={dashboardData.clients || 0}
              description="Total clients across tenants"
              icon={<Users className="h-5 w-5" />}
              // trend={clientTrend?.trend}
              trendValue={clientTrend?.trendValue}
            />
            <StatCard
              title="Total Revenue"
              value={dashboardData.revenue || "$0"}
              description="Monthly revenue"
              icon={<DollarSign className="h-5 w-5" />}
              // trend={revenueTrend?.trend}
              trendValue={revenueTrend?.trendValue}
            />
          </>
        )}
        {user.role === "tenant_admin" && (
          <>
            <StatCard
              title="Clients"
              value={dashboardData.clients || 0}
              description="Active clients"
              icon={<Users className="h-5 w-5" />}
              // trend={clientTrend?.trend}
              trendValue={clientTrend?.trendValue}
            />
            <StatCard
              title="Employees"
              value={dashboardData.employees || 0}
              description="Total employees"
              icon={<UserPlus className="h-5 w-5" />}
              // trend={employeeTrend?.trend}
              trendValue={employeeTrend?.trendValue}
            />
            <StatCard
              title="Supervisors"
              value={dashboardData.supervisors || 0}
              description="Active supervisors"
              icon={<Briefcase className="h-5 w-5" />}
              // trend={supervisorTrend?.trend}
              trendValue={supervisorTrend?.trendValue}
            />
          </>
        )}
        {user.role === "client_admin" && (
          <StatCard
            title="Branches"
            value={dashboardData.branches || 0}
            description="Total branches"
            icon={<Building2 className="h-5 w-5" />}
            // trend={branchTrend?.trend}
            trendValue={branchTrend?.trendValue}
          />
        )}
      </div>

      {/* Charts and Plan Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chart */}

        {/* Plan Info for tenant_admin */}
        {user.role === "tenant_admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.plan ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {dashboardData.plan.name}
                    </span>
                    <Badge
                      variant={
                        dashboardData.plan.status === "active"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {dashboardData.plan.status}
                    </Badge>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/plans/change">Change Plan</Link>
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  No active plan
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {user.role === "super_admin" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/plans/new">Create Plan</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add a new subscription plan</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/plans">Manage Plans</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View and edit existing plans</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/companies">Manage Companies</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Oversee tenant companies</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {user.role === "tenant_admin" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/clients">Add Client</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create a new client</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/contracts">Manage Contracts</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    View content to edit contracts
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {user.role === "client_admin" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/contracts">Make a Contract</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create a new contract</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/branches">Add Branch</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add a new branch</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
