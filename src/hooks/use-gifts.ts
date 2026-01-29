"use client";

import useSWR, { mutate } from "swr";
import type {
  ApiResponse,
  GiftDeal,
  GiftDealCreateInput,
  GiftDealUpdateInput,
  GiftAnalytics,
} from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.error || "Failed to fetch");
    throw error;
  }
  return json;
};

/**
 * Hook for managing gift deals with optimistic updates.
 * Follows the same pattern as useRateCards.
 */
export function useGifts() {
  const { data, error, isLoading } = useSWR<ApiResponse<GiftDeal[]>>(
    "/api/gifts",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const gifts = data?.data ?? [];

  /**
   * Create a new gift deal with optimistic update.
   */
  const createGift = async (input: GiftDealCreateInput): Promise<GiftDeal> => {
    // Create optimistic gift with temporary ID
    const optimisticGift: GiftDeal = {
      id: `temp-${Date.now()}`,
      creatorId: "",
      brandName: input.brandName,
      brandHandle: input.brandHandle ?? null,
      brandWebsite: input.brandWebsite ?? null,
      brandFollowers: input.brandFollowers ?? null,
      productDescription: input.productDescription,
      productValue: input.productValue,
      dateReceived: input.dateReceived ? new Date(input.dateReceived) : new Date(),
      contentType: null,
      contentUrl: null,
      contentDate: null,
      views: null,
      likes: null,
      comments: null,
      saves: null,
      shares: null,
      status: "received",
      conversionStatus: null,
      convertedDealId: null,
      convertedAmount: null,
      followUpDate: null,
      followUpSent: false,
      notes: input.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistic update
    mutate(
      "/api/gifts",
      (current: ApiResponse<GiftDeal[]> | undefined) => ({
        success: true,
        data: [optimisticGift, ...(current?.data ?? [])],
      }),
      false
    );

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();

      if (!res.ok) {
        // Revert on error
        mutate("/api/gifts");
        throw new Error(json.error || "Failed to create gift");
      }

      // Replace optimistic with real data
      mutate("/api/gifts");

      return json.data;
    } catch (err) {
      // Revert on error
      mutate("/api/gifts");
      throw err;
    }
  };

  /**
   * Update an existing gift deal.
   * Note: Skipping optimistic update due to complex date type handling.
   */
  const updateGift = async (
    id: string,
    input: GiftDealUpdateInput
  ): Promise<GiftDeal> => {
    const res = await fetch(`/api/gifts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Failed to update gift");
    }

    // Refresh with real data
    mutate("/api/gifts");

    return json.data;
  };

  /**
   * Delete a gift deal with optimistic update.
   */
  const deleteGift = async (id: string): Promise<void> => {
    // Optimistic update - remove the gift immediately
    mutate(
      "/api/gifts",
      (current: ApiResponse<GiftDeal[]> | undefined) => ({
        success: true,
        data: (current?.data ?? []).filter((gift) => gift.id !== id),
      }),
      false
    );

    try {
      const res = await fetch(`/api/gifts/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        // Revert on error
        mutate("/api/gifts");
        throw new Error(json.error || "Failed to delete gift");
      }

      // Confirm deletion with fresh data
      mutate("/api/gifts");
    } catch (err) {
      // Revert on error
      mutate("/api/gifts");
      throw err;
    }
  };

  // Computed values for quick access
  const activeGifts = gifts.filter(
    (g) => g.status !== "converted" && g.status !== "declined" && g.status !== "archived"
  );

  const followUpsDue = gifts.filter(
    (g) => g.followUpDate && new Date(g.followUpDate) <= new Date() && !g.followUpSent
  );

  const converted = gifts.filter((g) => g.status === "converted");

  return {
    gifts,
    activeGifts,
    followUpsDue,
    converted,
    isLoading,
    isError: !!error,
    createGift,
    updateGift,
    deleteGift,
  };
}

/**
 * Hook for fetching gift analytics.
 */
export function useGiftAnalytics() {
  const { data, error, isLoading } = useSWR<ApiResponse<GiftAnalytics>>(
    "/api/gifts?analytics=true",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    analytics: data?.data ?? null,
    isLoading,
    isError: !!error,
  };
}
