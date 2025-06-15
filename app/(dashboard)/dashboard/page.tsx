"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart3,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  percentage: string;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  percentage,
}: StatCardProps) {
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
        <div className="mt-2 flex items-center">
          {trend === "up" ? (
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-600" />
          ) : trend === "down" ? (
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-600" />
          ) : null}
          <span
            className={
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                  ? "text-red-600"
                  : ""
            }
          >
            {percentage}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Here's an overview of your business metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          description="Monthly revenue"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          percentage="+20.1% from last month"
        />
        <StatCard
          title="Active Users"
          value="2,350"
          description="Monthly active users"
          icon={<Users className="h-5 w-5" />}
          trend="up"
          percentage="+10.3% from last month"
        />
        <StatCard
          title="New Customers"
          value="573"
          description="New this month"
          icon={<Users className="h-5 w-5" />}
          trend="down"
          percentage="-2.5% from last month"
        />
        <StatCard
          title="Conversion Rate"
          value="3.2%"
          description="Visitors to customers"
          icon={<BarChart3 className="h-5 w-5" />}
          trend="up"
          percentage="+4.1% from last month"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full w-full rounded-md border border-dashed border-gray-300 flex items-center justify-center">
              <p className="text-sm text-gray-500">Revenue Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                "John Doe",
                "Jane Smith",
                "Robert Johnson",
                "Emily Davis",
                "Michael Wilson",
              ].map((name, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-gray-500">
                      Joined {i + 1} day{i !== 0 ? "s" : ""} ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
