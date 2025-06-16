import { mutate } from "swr";
import { useState, useCallback } from "react";
import { useSession } from "./useSession";
import useSWR from "swr";

export interface Branch {
  id: string;
  name: string;
  address?: string;
  supervisorId?: string | null; // Allow null explicitly
  clientId: string;
  createdAt?: string;
}

interface BranchesResponse {
  success: boolean;
  data: Branch[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

interface CreateBranchData {
  name: string;
  clientId: string;
  address?: string;
  // supervisorId omitted to enforce null
}

interface UpdateBranchData {
  name?: string;
  address?: string;
  supervisorId?: string | null; // Allow null explicitly
  clientId?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.status}`);
  }
  const json = await response.json();
  return {
    success: true,
    data: Array.isArray(json) ? json : json.data || [],
    meta: json.meta || undefined,
  };
};

export function useBranches(
  page = 1,
  limit = 10,
  search = "",
  clientId?: string
) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: user } = useSession();

  // Validate clientId for client_admin, fallback to provided clientId for other roles
  if (
    !clientId &&
    (!user || !["client_admin"].includes(user.role) || !user.clientId)
  ) {
    return {
      branches: [],
      meta: undefined,
      isLoading: false,
      error: new Error("Client ID required"),
      createBranch: async () => Promise.reject(new Error("Client ID required")),
      updateBranch: async () => Promise.reject(new Error("Client ID required")),
      deleteBranch: async () => Promise.reject(new Error("Client ID required")),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  const finalClientId = clientId || user?.clientId;

  const params = new URLSearchParams({
    page: page.toString(),
    clientId: finalClientId!,
    limit: limit.toString(),
    ...(search && { search }),
  });

  const { data, error, isLoading } = useSWR<BranchesResponse>(
    finalClientId ? `/api/branches?${params}` : null,
    fetcher
  );

  const createBranch = useCallback(
    async (branchData: CreateBranchData) => {
      setIsCreating(true);
      try {
        // Enforce supervisorId as null for client_admin
        const payload = {
          ...branchData,
          clientId: finalClientId!, // Ensure clientId is set
        };

        const response = await fetch("/api/branches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `Failed to create branch: ${response.status}`
          );
        }

        const result = await response.json();
        mutate(`/api/branches?${params}`);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [params, finalClientId]
  );

  const updateBranch = useCallback(
    async (id: string, branchData: UpdateBranchData) => {
      setIsUpdating(true);
      try {
        const response = await fetch(`/api/branches/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(branchData),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `Failed to update branch: ${response.status}`
          );
        }

        const result = await response.json();
        mutate(`/api/branches?${params}`);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [params]
  );

  const deleteBranch = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/branches/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `Failed to delete branch: ${response.status}`
          );
        }

        const result = await response.json();
        mutate(`/api/branches?${params}`);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [params]
  );

  return {
    branches: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
