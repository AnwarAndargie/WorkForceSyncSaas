"use client";

import { useAuth, User } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User["role"][];
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles = ["super_admin", "tenant_admin", "client_admin", "employee"],
  requireAuth = true,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push("/auth/sign-in");
    }
  }, [loading, user, requireAuth, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to access this page.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (user && !allowedRoles.includes(user.role)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-2">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Required roles: {allowedRoles.join(", ")}
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
