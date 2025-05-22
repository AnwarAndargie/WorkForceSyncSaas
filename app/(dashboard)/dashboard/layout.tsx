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

      <div className="flex flex-row space-x-12 w-[100vw]">
        <div className="w-7">
          <AppSidebar />
        </div>

        {/* Main content */}
        <div className=" min-w-2xl overflow-y-auto p-4 ml-78">{children}</div>
      </div>
    </div>
  );
}
