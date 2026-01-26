"use client";

import useSWR, { mutate } from "swr";
import type {
  ApiResponse,
  SavedRateCard,
  SavedRateCardCreateInput,
  SavedRateCardUpdateInput,
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

export function useRateCards() {
  const { data, error, isLoading } = useSWR<ApiResponse<SavedRateCard[]>>(
    "/api/rate-cards",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const rateCards = data?.data ?? [];

  /**
   * Create a new rate card with optimistic update.
   */
  const createRateCard = async (input: SavedRateCardCreateInput): Promise<SavedRateCard> => {
    // Create optimistic rate card with temporary ID
    const optimisticRateCard: SavedRateCard = {
      id: `temp-${Date.now()}`,
      creatorId: "",
      name: input.name ?? "Untitled Rate Card",
      platform: input.platform,
      contentFormat: input.contentFormat,
      baseRate: input.baseRate,
      finalRate: input.finalRate,
      adjustments: input.adjustments,
      dealQuality: input.dealQuality ?? null,
      briefId: input.briefId ?? null,
      brandName: input.brandName ?? null,
      campaignName: input.campaignName ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    // Optimistic update
    mutate(
      "/api/rate-cards",
      (current: ApiResponse<SavedRateCard[]> | undefined) => ({
        success: true,
        data: [optimisticRateCard, ...(current?.data ?? [])],
      }),
      false
    );

    try {
      const res = await fetch("/api/rate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();

      if (!res.ok) {
        // Revert on error
        mutate("/api/rate-cards");
        throw new Error(json.error || "Failed to create rate card");
      }

      // Replace optimistic with real data
      mutate("/api/rate-cards");

      return json.data;
    } catch (err) {
      // Revert on error
      mutate("/api/rate-cards");
      throw err;
    }
  };

  /**
   * Update an existing rate card with optimistic update.
   */
  const updateRateCard = async (
    id: string,
    input: SavedRateCardUpdateInput
  ): Promise<SavedRateCard> => {
    // Optimistic update
    mutate(
      "/api/rate-cards",
      (current: ApiResponse<SavedRateCard[]> | undefined) => ({
        success: true,
        data: (current?.data ?? []).map((card) =>
          card.id === id
            ? { ...card, ...input, updatedAt: new Date() }
            : card
        ),
      }),
      false
    );

    try {
      const res = await fetch(`/api/rate-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();

      if (!res.ok) {
        // Revert on error
        mutate("/api/rate-cards");
        throw new Error(json.error || "Failed to update rate card");
      }

      // Refresh with real data
      mutate("/api/rate-cards");

      return json.data;
    } catch (err) {
      // Revert on error
      mutate("/api/rate-cards");
      throw err;
    }
  };

  /**
   * Delete a rate card with optimistic update.
   */
  const deleteRateCard = async (id: string): Promise<void> => {
    // Optimistic update - remove the card immediately
    mutate(
      "/api/rate-cards",
      (current: ApiResponse<SavedRateCard[]> | undefined) => ({
        success: true,
        data: (current?.data ?? []).filter((card) => card.id !== id),
      }),
      false
    );

    try {
      const res = await fetch(`/api/rate-cards/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        // Revert on error
        mutate("/api/rate-cards");
        throw new Error(json.error || "Failed to delete rate card");
      }

      // Confirm deletion with fresh data
      mutate("/api/rate-cards");
    } catch (err) {
      // Revert on error
      mutate("/api/rate-cards");
      throw err;
    }
  };

  return {
    rateCards,
    isLoading,
    isError: !!error,
    createRateCard,
    updateRateCard,
    deleteRateCard,
  };
}
