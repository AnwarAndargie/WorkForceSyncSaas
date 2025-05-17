"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";
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
        <AppSidebar />
        <SidebarTrigger />
        {children}
      </div>
    </div>
  );
}
