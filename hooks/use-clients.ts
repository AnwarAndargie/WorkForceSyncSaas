import { mutate } from "swr";
import { useState, useCallback } from "react";
import { useSession } from "./useSession";
import useSWR from "swr";

export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  adminId?: string;
  tenantId: string;
}

interface ClientsResponse {
  success: boolean;
  data: Client[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

interface CreateClientData {
  name: string;
  tenantId: string;
  adminId?: string;
  phone?: string;
  address?: string;
}

interface UpdateClientData {
  name?: string;
  phone?: string;
  address?: string;
  adminId?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.status}`);
  }
  const json = await response.json();
  // Normalize to { success, data, meta }
  return {
    success: true,
    data: Array.isArray(json) ? json : json.data || [],
    meta: json.meta || undefined,
  };
};

export function useClients(
  page = 1,
  limit = 10,
  search = "",
  tenantId?: string
) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: user } = useSession();

  if (!tenantId && !user?.tenantId) {
    return {
      clients: [],
      meta: undefined,
      isLoading: false,
      error: new Error("Tenant ID required"),
      createClient: async () => Promise.reject(new Error("Tenant ID required")),
      updateClient: async () => Promise.reject(new Error("Tenant ID required")),
      deleteClient: async () => Promise.reject(new Error("Tenant ID required")),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  const finalTenantId = tenantId || user?.tenantId;

  const params = new URLSearchParams({
    page: page.toString(),
    tenantId: finalTenantId!,
    limit: limit.toString(),
    ...(search && { search }),
  });

  const { data, error, isLoading } = useSWR<ClientsResponse>(
    `/api/clients?${params}`,
    fetcher
  );

  const createClient = useCallback(
    async (clientData: CreateClientData) => {
      setIsCreating(true);
      try {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clientData),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `Failed to create client: ${response.status}`
          );
        }

        const result = await response.json();
        mutate(`/api/clients?${params}`);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [params]
  );

  const updateClient = useCallback(
    async (id: string, clientData: UpdateClientData) => {
      setIsUpdating(true);
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clientData),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `Failed to update client: ${response.status}`
          );
        }

        const result = await response.json();
        mutate(`/api/clients?${params}`);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [params]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `Failed to delete client: ${response.status}`
          );
        }

        const result = await response.json();
        mutate(`/api/clients?${params}`);
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
    clients: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
