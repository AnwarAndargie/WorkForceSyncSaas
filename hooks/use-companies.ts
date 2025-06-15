import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  ownerId?: string;
  slug?: string;
  createdAt?: string;
}

interface CompaniesResponse {
  success: boolean;
  data: Company[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

interface CreateCompanyData {
  name: string;
  ownerId: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
}

interface UpdateCompanyData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch");
  }
  return response.json();
};

export function useCompanies(page = 1, limit = 10, search = "") {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  const { data, error, isLoading } = useSWR<CompaniesResponse>(
    `/api/companies?${params}`,
    fetcher
  );

  const createCompany = useCallback(async (companyData: CreateCompanyData) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create company");
      }

      const result = await response.json();
      
      // Revalidate the companies list
      mutate(`/api/companies?${params}`);
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [params]);

  const updateCompany = useCallback(async (id: string, companyData: UpdateCompanyData) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update company");
      }

      const result = await response.json();
      
      // Revalidate the companies list
      mutate(`/api/companies?${params}`);
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [params]);

  const deleteCompany = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete company");
      }

      const result = await response.json();
      
      // Revalidate the companies list
      mutate(`/api/companies?${params}`);
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [params]);

  return {
    companies: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    isCreating,
    isUpdating,
    isDeleting,
  };
} 