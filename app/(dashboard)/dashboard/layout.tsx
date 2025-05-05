"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  Settings,
  Shield,
  Activity,
  Menu,
  BarChart3,
  FileText,
  Home,
  BookOpen,
  Container,
  UsersRound,
  Users2,
  ListCollapse,
} from "lucide-react";
import useSWR from "swr";
import { User } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: user } = useSWR<User>("/api/user", fetcher);

  if (!user) {
    return <div>Loading...</div>;
  }

  const isSuperAdmin = user.role === "super_admin";
  const isOrgAdmin = user.role === "org_admin";

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home, visible: true },
    {
      href: "/dashboard/organizations",
      label: "Organizations",
      icon: ListCollapse,
      visible: isSuperAdmin,
    },
    {
      href: "/dashboard/members",
      label: "Members",
      icon: Users2,
      visible: isOrgAdmin,
    },

    {
      href: "/dashboard/plans",
      label: "Plans",
      icon: Container,
      visible: isSuperAdmin,
    },
    {
      href: "/dashboard/reports",
      label: "Reports",
      icon: BarChart3,
      visible: true,
    },
    {
      href: "/dashboard/general",
      label: "General",
      icon: Settings,
      visible: true,
    },
    {
      href: "/dashboard/security",
      label: "Security",
      icon: Shield,
      visible: true,
    },
    {
      href: "/dashboard/activity",
      label: "Activity",
      icon: Activity,
      visible: true,
    },
  ].filter((item) => item.visible);

  return (
    <div className="flex min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:static md:flex md:flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <Button
            size="icon"
            className="bg-orange-400 hover:bg-orange-300 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center p-2 rounded-md ${
                pathname === href
                  ? "bg-orange-300 text-white"
                  : "text-gray-700 hover:bg-orange-100"
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b md:hidden">
          <Button
            className="bg-orange-400 hover:bg-orange-300"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
