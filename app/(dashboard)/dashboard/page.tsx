"use client";

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
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";
import Link from "next/link";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return res.json();
  });

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-orange-100 p-1.5 text-orange-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface DashboardMetrics {
  tenants?: number;
  clients?: number;
  revenue?: string;
  employees?: number;
  supervisors?: number;
  branches?: number;
}

export default function DashboardPage() {
  const { data: user, error: userError } = useSWR<SessionUser>(
    "/api/user",
    fetcher
  );
  const { data: metrics, error: metricsError } = useSWR<DashboardMetrics>(
    "/api/dashboard-metrics",
    fetcher
  );

  if (userError || metricsError) {
    return (
      <div className="container mx-auto py-10">Error loading dashboard</div>
    );
  }

  if (!user || !metrics) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your business metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {user.role === "super_admin" && (
          <>
            <StatCard
              title="Tenants"
              value={metrics.tenants || 0}
              description="Total companies"
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              title="Clients"
              value={metrics.clients || 0}
              description="Total clients"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Total Revenue"
              value={metrics.revenue || "$0"}
              description="Monthly revenue"
              icon={<DollarSign className="h-5 w-5" />}
            />
          </>
        )}
        {user.role === "tenant_admin" && (
          <>
            <StatCard
              title="Clients"
              value={metrics.clients || 0}
              description="Active clients"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Employees"
              value={metrics.employees || 0}
              description="Total employees"
              icon={<UserPlus className="h-5 w-5" />}
            />
            <StatCard
              title="Supervisors"
              value={metrics.supervisors || 0}
              description="Active supervisors"
              icon={<Briefcase className="h-5 w-5" />}
            />
          </>
        )}
        {user.role === "client_admin" && (
          <StatCard
            title="Branches"
            value={metrics.branches || 0}
            description="Total branches"
            icon={<Building2 className="h-5 w-5" />}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.role === "super_admin" && (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboards/plans/new">Create Plans</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/reports">View Contracts</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/companies">Manage Companies</Link>
                </Button>
              </>
            )}
            {user.role === "tenant_admin" && (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/clients">Add Client</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/contracts">Manage Contracts</Link>
                </Button>
              </>
            )}
            {user.role === "client_admin" && (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/contracts">Make a Contract</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/branches">Add Branch</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
