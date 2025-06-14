"use client";

import React from "react";
import { AppSidebar } from "@/components/common/app-sidebar";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  });

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

  console.log("User role:", user?.role, "Error:", error, "Loading:", isLoading);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex justify-center items-center h-screen space-x-4">
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
    );
  }

  return (
    <div className="flex h-screen w-full space-x-64">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
