"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  Settings,
  Shield,
  Calendar,
  Menu,
  BarChart3,
  FileText,
  Home,
  Building,
  Container,
  UserRound,
  Users2,
  ListCollapse,
  Briefcase,
  BellRing,
  Receipt,
  Mail,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const user = {
    name: "Anwar",
    role: "super_admin",
  };

  const isSuperAdmin = user.role === "super_admin";
  const isOrgAdmin = user.role === "org_admin";
  const isMember = user.role === "member";

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home, visible: true },
    {
      href: "/dashboard/companies",
      label: "Companies",
      icon: Building,
      visible: isSuperAdmin,
    },
    {
      href: "/dashboard/users",
      label: "User Profile",
      icon: UserRound,
      visible: true,
    },
    {
      href: "/dashboard/team",
      label: "Workforce",
      icon: Users,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/clients",
      label: "Clients",
      icon: Users2,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/branches",
      label: "Branches",
      icon: ListCollapse,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/services",
      label: "Services",
      icon: Briefcase,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/assignments",
      label: "Assignments",
      icon: Calendar,
      visible: true,
    },
    {
      href: "/dashboard/contracts",
      label: "Contracts",
      icon: FileText,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/invoices",
      label: "Invoices",
      icon: Receipt,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/reports",
      label: "Reports",
      icon: BarChart3,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      icon: BellRing,
      visible: true,
    },
    {
      href: "/dashboard/feedback",
      label: "Feedback",
      icon: Mail,
      visible: true,
    },
    {
      href: "/dashboard/plans",
      label: "Subscription",
      icon: Container,
      visible: isOrgAdmin || isSuperAdmin,
    },
    {
      href: "/dashboard/general",
      label: "Settings",
      icon: Settings,
      visible: true,
    },
    {
      href: "/dashboard/security",
      label: "Security",
      icon: Shield,
      visible: true,
    },
  ].filter((item) => item.visible);

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background px-4 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="font-semibold">WorkforceSync</div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:relative lg:translate-x-0"
          )}
        >
          <div className="flex h-14 items-center border-b px-4">
            <div className="flex items-center gap-2 font-semibold">
              <Building className="h-5 w-5" />
              <span>WorkforceSync</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-1">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.name}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
