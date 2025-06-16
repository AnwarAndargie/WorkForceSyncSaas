import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SessionUser } from "@/lib/auth/types";
import { User } from "@/lib/db/schema";
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

export function AppSidebar({ user }: { user: SessionUser }) {
  if (!user) {
    return (
      <Sidebar className="h-screen w-64 border-r bg-white z-40 mt-22 ml-8">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col gap-3">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard">
                      <Home />
                      <span>Overview</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  const isSuperAdmin = user.role === "super_admin";
  const isOrgAdmin = user.role === "tenant_admin";
  const isClientAdmin = user.role === "client_admin";
  const isEmployee = user.role === "employee";

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home, visible: true },
    {
      href: "/dashboard/companies",
      label: "Companies",
      icon: Building,
      visible: isSuperAdmin,
    },
    {
      href: "/dashboard/work-forces",
      label: "Employees",
      icon: Users2,
      visible: isOrgAdmin,
    },
    {
      href: "/dashboard/clients",
      label: "Clients",
      icon: Users2,
      visible: isOrgAdmin,
    },
    {
      href: "/dashboard/branches",
      label: "Branches",
      icon: ListCollapse,
      visible: isClientAdmin,
    },
    {
      href: "/dashboard/assignments",
      label: "Assignments",
      icon: Calendar,
      visible: !isSuperAdmin,
    },
    {
      href: "/dashboard/contracts",
      label: "Contracts",
      icon: FileText,
      visible: isOrgAdmin || isSuperAdmin || isClientAdmin,
    },
    {
      href: "/dashboard/invoices",
      label: "Invoices",
      icon: Receipt,
      visible: !isEmployee,
    },
    {
      href: "/dashboard/reports",
      label: "Reports",
      icon: Mail,
      visible: isOrgAdmin || isClientAdmin,
    },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      icon: BellRing,
      visible: true,
    },
    {
      href: "/dashboard/plans",
      label: "Subscription",
      icon: Container,
      visible: isSuperAdmin || isOrgAdmin,
    },
    {
      href: "/dashboard/settings",
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
    <Sidebar className="h-screen w-64 border-r bg-white z-40 mt-22 ml-8">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-3">
              {navItems.map((item) => (
                <SidebarMenuItem
                  key={item.href}
                  className="w-full flex items-center"
                >
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
