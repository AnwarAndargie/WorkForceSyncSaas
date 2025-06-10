"use client";

import React from "react";
import { AppSidebar } from "@/components/common/app-sidebar";
import useSWR from "swr";
import { User } from "@/lib/db/schema";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = useSWR<User>("/api/user", fetcher);
  const router = useRouter();
  if (!user) {
    router.push("/auth/sign-in");
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
