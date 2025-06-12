import useSWR, { mutate } from "swr";
import { useState, useCallback } from "react";

export interface Employee {
  id: string;
  name: string;
  phone_number?: string;
  address?: string;
  tenantId?: string;
  branchId?: string;
  branchName?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch");
  }
  return response.json();
};

export interface Employee {
  id: string;
  name: string;
  phone_number?: string;
  salary?: string;
  address?: string;
  tenantId?: string;
  branchId?: string;
  branchName?: string;
}

interface EmployeesResponse {
  success: boolean;
  data: Employee[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

interface CreateEmployeeData {
  name: string;
  tenantId: string;
  salary: string;
  branchId?: string;
  phone_number?: string;
  address?: string;
}

interface UpdateEmployeeData {
  name?: string;
  phone_number?: string;
  salary?: string;
  address?: string;
  tenantId?: string;
}

export function useEmployees(page = 1, limit = 10, search = "") {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  const { data, error, isLoading } = useSWR<EmployeesResponse>(
    `/api/tenant-members?${params}`,
    fetcher
  );

  const createEmployee = useCallback(
    async (employeeData: CreateEmployeeData) => {
      setIsCreating(true);
      try {
        const response = await fetch("/api/tenant-members", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(employeeData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Failed to create client"
          );
        }

        const result = await response.json();
        mutate(`/api/tenant-members?${params}`);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [params]
  );

  const updateEmployee = useCallback(
    async (id: string, clientData: UpdateEmployeeData) => {
      setIsUpdating(true);
      try {
        const response = await fetch(`/api/tenant-members/${id}`, {
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

  const deleteEmployee = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/tenant-members/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Failed to delete client"
          );
        }

        const result = await response.json();
        mutate(`/api/tenant-members?${params}`);
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
    employees: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
