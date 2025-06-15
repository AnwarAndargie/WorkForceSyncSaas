"use client";
import { Metadata } from "next";
import { PlanForm } from "../_components/plans-form";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const metadata: Metadata = {
  title: "New Plan",
  description: "Create a new subscription plan",
};

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

export default function NewPlanPage() {
  const { data: user, isLoading } = useSWR<SessionUser>("/api/user", fetcher);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "super_admin")) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (!user || user.role !== "super_admin") return null;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Create New Plan</h1>
      <PlanForm />
    </div>
  );
}
