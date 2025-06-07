"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="px-8 py-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
