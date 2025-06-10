"use client";

import React from "react";
import { AppSidebar } from "@/components/common/app-sidebar";
import useSWR from "swr";
import { User } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = useSWR<User>("/api/user", fetcher);
  const router = useRouter();
  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full">
          <Link href="/auth/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }
  return (
    <div className="flex h-screen space-x-64 w-full">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden w-3/4">
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
