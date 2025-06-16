"use client";
import { AssignmentsDashboard } from "@/components/dashboard/assignments/AssignmentsDashboard";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { SessionUser } from "@/lib/auth/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default async function AssignmentsPage() {
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {user.role === "tenant_admin"
            ? "Manage Assignments"
            : "My Assignments"}
        </h2>
      </div>
      <AssignmentsDashboard user={user} />
    </div>
  );
}
