import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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

export function AppSidebar() {
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
    <Sidebar className="fixed left-0 top-0 h-screen  w-64 border-r bg-white z-40 mt-22 ml-8">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-3">
              {navItems.map((item) => (
                <SidebarMenuItem
                  key={item.label}
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
