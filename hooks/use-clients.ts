import useSWR, { mutate } from "swr";
import { useState, useCallback } from "react";

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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch");
  }
  return response.json();
};

export function useClients(page = 1, limit = 10, search = "") {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const params = new URLSearchParams({
    page: page.toString(),
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
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Failed to create client"
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
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Failed to update client"
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
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Failed to delete client"
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
