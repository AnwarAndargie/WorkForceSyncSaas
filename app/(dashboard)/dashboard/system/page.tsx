"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Activity,
  AlertCircle,
  Settings,
  FileText,
  Server,
  Database,
  Mail,
  Users,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import useSWR from "swr";
import { User } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SystemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/user");
        const user = await userRes.json();

        setUser(user);

        if (!user || user.role !== "super_admin") {
          router.push("/dashboard");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  const systemModules = [
    {
      title: "API Services",
      icon: Server,
      color: "text-blue-500",
      status: "Operational",
      statusColor: "bg-green-100 text-green-800",
      description: "REST API endpoints and services",
      metrics: [
        { label: "Uptime", value: "99.98%" },
        { label: "Response Time", value: "145ms" },
        { label: "Error Rate", value: "0.02%" },
      ],
      href: "/dashboard/system/api",
    },
    {
      title: "Database",
      icon: Database,
      color: "text-purple-500",
      status: "Operational",
      statusColor: "bg-green-100 text-green-800",
      description: "PostgreSQL database and connections",
      metrics: [
        { label: "Uptime", value: "100%" },
        { label: "Query Time", value: "12ms" },
        { label: "Storage Used", value: "42%" },
      ],
      href: "/dashboard/system/database",
    },
    {
      title: "Email Service",
      icon: Mail,
      color: "text-yellow-500",
      status: "Operational",
      statusColor: "bg-green-100 text-green-800",
      description: "Email delivery and templates",
      metrics: [
        { label: "Delivery Rate", value: "99.7%" },
        { label: "Send Volume", value: "2.3k/day" },
        { label: "Bounce Rate", value: "0.3%" },
      ],
      href: "/dashboard/system/email",
    },
    {
      title: "Authentication",
      icon: Shield,
      color: "text-green-500",
      status: "Operational",
      statusColor: "bg-green-100 text-green-800",
      description: "User authentication and security",
      metrics: [
        { label: "Success Rate", value: "99.95%" },
        { label: "Active Sessions", value: "1,254" },
        { label: "Failed Attempts", value: "23" },
      ],
      href: "/dashboard/system/auth",
    },
    {
      title: "Storage",
      icon: FileText,
      color: "text-orange-500",
      status: "Degraded",
      statusColor: "bg-yellow-100 text-yellow-800",
      description: "File storage and CDN",
      metrics: [
        { label: "Uptime", value: "99.5%" },
        { label: "Transfer Speed", value: "8.2MB/s" },
        { label: "Space Used", value: "76%" },
      ],
      href: "/dashboard/system/storage",
    },
    {
      title: "User Management",
      icon: Users,
      color: "text-red-500",
      status: "Operational",
      statusColor: "bg-green-100 text-green-800",
      description: "User accounts and permissions",
      metrics: [
        { label: "Active Users", value: "3,478" },
        { label: "New Today", value: "52" },
        { label: "Deletion Rate", value: "0.1%" },
      ],
      href: "/dashboard/system/users",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "System" },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Overview</h1>
          <p className="text-muted-foreground">
            Monitor and manage system components
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/system/logs">
            <Button variant="outline" className="flex gap-2 items-center">
              <Activity className="h-4 w-4" />
              System Logs
            </Button>
          </Link>
          <Link href="/dashboard/system/settings">
            <Button className="bg-orange-400 text-white hover:bg-orange-300 flex gap-2 items-center">
              <Settings className="h-4 w-4" />
              System Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemModules.map((module, idx) => {
          const IconComponent = module.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <IconComponent className={`h-6 w-6 ${module.color}`} />
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs ${module.statusColor}`}
                  >
                    {module.status}
                  </span>
                </div>
                <CardTitle className="mt-2">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {module.metrics.map((metric, midx) => (
                    <div key={midx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          {metric.label}
                        </span>
                        <span className="text-sm font-medium">
                          {metric.value}
                        </span>
                      </div>
                      <Progress
                        value={parseFloat(metric.value) || Math.random() * 100}
                      />
                    </div>
                  ))}
                  <Link href={module.href}>
                    <Button variant="outline" className="w-full mt-2">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Overall system status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    System Uptime
                  </span>
                  <span className="text-sm font-medium">99.97%</span>
                </div>
                <Progress value={99.97} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    CPU Usage
                  </span>
                  <span className="text-sm font-medium">42%</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Memory Usage
                  </span>
                  <span className="text-sm font-medium">64%</span>
                </div>
                <Progress value={64} className="h-2" />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Disk Space
                  </span>
                  <span className="text-sm font-medium">76%</span>
                </div>
                <Progress value={76} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Network Bandwidth
                  </span>
                  <span className="text-sm font-medium">38%</span>
                </div>
                <Progress value={38} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    API Requests
                  </span>
                  <span className="text-sm font-medium">83%</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
