"use client";

import React from "react";
import { AppSidebar } from "@/components/common/app-sidebar";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch user: ${res.status}`);
  }
  return res.json();
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: user,
    error,
    isLoading,
  } = useSWR<SessionUser>("/api/user", fetcher);
  const router = useRouter();

  console.log(
    "User role:",
    user?.role,
    "Error:",
    error?.message,
    "Loading:",
    isLoading
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full ">
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Pricing
          </Link>
          <Button asChild className="rounded-full">
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full space-x-64">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
