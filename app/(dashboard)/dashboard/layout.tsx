"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/common/app-sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background px-4 lg:hidden">
        <div className="font-semibold">WorkforceSync</div>
      </header>

      <div className="flex flex-between overflow-hidden">
        <div>
          <AppSidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 w-full ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
