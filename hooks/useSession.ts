"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error(`Fetch error: ${res.status}`);
  }
  return res.json();
};

export function useSession() {
  const { data, error, mutate } = useSWR<SessionUser>("/api/user", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Ensure session is revalidated on mount
  useEffect(() => {
    mutate();
  }, [mutate]);

  return {
    data,
    isLoading: !error && data === undefined,
    error,
    mutate,
  };
}
