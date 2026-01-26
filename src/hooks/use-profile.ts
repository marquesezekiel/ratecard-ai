"use client";

import useSWR, { mutate } from "swr";
import type { ApiResponse, CreatorProfile } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.error || "Failed to fetch");
    throw error;
  }
  return json;
};

export function useProfile() {
  const { data, error, isLoading } = useSWR<ApiResponse<CreatorProfile | null>>(
    "/api/profile",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    profile: data?.data ?? null,
    isLoading,
    isError: !!error,
    mutate: () => mutate("/api/profile"),
  };
}
