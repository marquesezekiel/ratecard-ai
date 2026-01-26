import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SavedRates } from "@/components/rate-card/saved-rates";
import type { SavedRateCard } from "@/lib/types";

// Mock the useRateCards hook
const mockDeleteRateCard = vi.fn();
const mockUpdateRateCard = vi.fn();
const mockCreateRateCard = vi.fn();

vi.mock("@/hooks/use-rate-cards", () => ({
  useRateCards: vi.fn(() => ({
    rateCards: [],
    isLoading: false,
    isError: false,
    deleteRateCard: mockDeleteRateCard,
    updateRateCard: mockUpdateRateCard,
    createRateCard: mockCreateRateCard,
  })),
}));

// Mock the analytics
vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

// Import the mock after mocking
import { useRateCards } from "@/hooks/use-rate-cards";

const mockRateCards: SavedRateCard[] = [
  {
    id: "rate-1",
    creatorId: "user-1",
    name: "Instagram Reel Rate",
    platform: "instagram",
    contentFormat: "reel",
    baseRate: 400,
    finalRate: 520,
    adjustments: [],
    dealQuality: null,
    briefId: null,
    brandName: "Test Brand",
    campaignName: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    lastAccessedAt: new Date("2024-01-01"),
  },
  {
    id: "rate-2",
    creatorId: "user-1",
    name: "TikTok Video Rate",
    platform: "tiktok",
    contentFormat: "video",
    baseRate: 300,
    finalRate: 450,
    adjustments: [],
    dealQuality: null,
    briefId: null,
    brandName: null,
    campaignName: null,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
    lastAccessedAt: new Date("2024-01-02"),
  },
];

describe("SavedRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return empty state by default
    vi.mocked(useRateCards).mockReturnValue({
      rateCards: [],
      isLoading: false,
      isError: false,
      deleteRateCard: mockDeleteRateCard,
      updateRateCard: mockUpdateRateCard,
      createRateCard: mockCreateRateCard,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("renders loading state with accessible role and label", () => {
      vi.mocked(useRateCards).mockReturnValue({
        rateCards: [],
        isLoading: true,
        isError: false,
        deleteRateCard: mockDeleteRateCard,
        updateRateCard: mockUpdateRateCard,
        createRateCard: mockCreateRateCard,
      });

      render(<SavedRates />);

      const loadingElement = screen.getByRole("status");
      expect(loadingElement).toHaveAttribute("aria-label", "Loading saved rates");
      expect(screen.getByText("Loading your saved rates...")).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("renders error state when loading fails", () => {
      vi.mocked(useRateCards).mockReturnValue({
        rateCards: [],
        isLoading: false,
        isError: true,
        deleteRateCard: mockDeleteRateCard,
        updateRateCard: mockUpdateRateCard,
        createRateCard: mockCreateRateCard,
      });

      render(<SavedRates />);

      expect(screen.getByText("Failed to load saved rates. Please try refreshing the page.")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("renders empty state when no rate cards exist", () => {
      render(<SavedRates />);

      expect(screen.getByText("No saved rates yet. Generate a quote and save it for quick access.")).toBeInTheDocument();
    });

    it("shows Quick Quote button when onQuickQuote prop is provided", () => {
      const mockOnQuickQuote = vi.fn();
      render(<SavedRates onQuickQuote={mockOnQuickQuote} />);

      const quickQuoteButton = screen.getByRole("button", { name: /Quick Quote/i });
      expect(quickQuoteButton).toBeInTheDocument();

      fireEvent.click(quickQuoteButton);
      expect(mockOnQuickQuote).toHaveBeenCalled();
    });

    it("shows Upload Brief button when onUploadBrief prop is provided", () => {
      const mockOnUploadBrief = vi.fn();
      render(<SavedRates onUploadBrief={mockOnUploadBrief} />);

      const uploadButton = screen.getByRole("button", { name: /Upload Brief/i });
      expect(uploadButton).toBeInTheDocument();

      fireEvent.click(uploadButton);
      expect(mockOnUploadBrief).toHaveBeenCalled();
    });
  });

  describe("With rate cards", () => {
    beforeEach(() => {
      vi.mocked(useRateCards).mockReturnValue({
        rateCards: mockRateCards,
        isLoading: false,
        isError: false,
        deleteRateCard: mockDeleteRateCard,
        updateRateCard: mockUpdateRateCard,
        createRateCard: mockCreateRateCard,
      });
    });

    it("renders rate cards from API", () => {
      render(<SavedRates />);

      expect(screen.getByText("Instagram Reel Rate")).toBeInTheDocument();
      expect(screen.getByText("TikTok Video Rate")).toBeInTheDocument();
    });

    it("displays correct rate amounts", () => {
      render(<SavedRates />);

      expect(screen.getByText("$520")).toBeInTheDocument();
      expect(screen.getByText("$450")).toBeInTheDocument();
    });

    it("displays platform and format info", () => {
      render(<SavedRates />);

      expect(screen.getByText(/instagram · reel/i)).toBeInTheDocument();
      expect(screen.getByText(/tiktok · video/i)).toBeInTheDocument();
    });

    it("displays brand name when available", () => {
      render(<SavedRates />);

      expect(screen.getByText(/Test Brand/)).toBeInTheDocument();
    });
  });

  describe("Delete operation", () => {
    beforeEach(() => {
      vi.mocked(useRateCards).mockReturnValue({
        rateCards: mockRateCards,
        isLoading: false,
        isError: false,
        deleteRateCard: mockDeleteRateCard,
        updateRateCard: mockUpdateRateCard,
        createRateCard: mockCreateRateCard,
      });
    });

    it("calls deleteRateCard when delete button is clicked", async () => {
      mockDeleteRateCard.mockResolvedValue(undefined);
      render(<SavedRates />);

      const deleteButtons = screen.getAllByRole("button", { name: /Delete rate for/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDeleteRateCard).toHaveBeenCalledWith("rate-1");
      });
    });

    it("tracks delete event in analytics", async () => {
      const { trackEvent } = await import("@/lib/analytics");
      mockDeleteRateCard.mockResolvedValue(undefined);

      render(<SavedRates />);

      const deleteButtons = screen.getAllByRole("button", { name: /Delete rate for/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith("rate_deleted", { rateId: "rate-1" });
      });
    });
  });

  describe("Copy operation", () => {
    beforeEach(() => {
      vi.mocked(useRateCards).mockReturnValue({
        rateCards: mockRateCards,
        isLoading: false,
        isError: false,
        deleteRateCard: mockDeleteRateCard,
        updateRateCard: mockUpdateRateCard,
        createRateCard: mockCreateRateCard,
      });

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    it("copies rate to clipboard when copy button is clicked", async () => {
      render(<SavedRates />);

      const copyButtons = screen.getAllByRole("button", { name: /Copy rate for/i });
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "$520 for reel on instagram"
        );
      });
    });
  });

  describe("Edit operation", () => {
    beforeEach(() => {
      vi.mocked(useRateCards).mockReturnValue({
        rateCards: mockRateCards,
        isLoading: false,
        isError: false,
        deleteRateCard: mockDeleteRateCard,
        updateRateCard: mockUpdateRateCard,
        createRateCard: mockCreateRateCard,
      });
    });

    it("enters edit mode when name is clicked", () => {
      render(<SavedRates />);

      const rateNameButton = screen.getByRole("button", { name: "Instagram Reel Rate" });
      fireEvent.click(rateNameButton);

      // Should show an input field
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("Instagram Reel Rate");
    });

    it("calls updateRateCard on blur", async () => {
      mockUpdateRateCard.mockResolvedValue(undefined);
      render(<SavedRates />);

      // Enter edit mode
      const rateNameButton = screen.getByRole("button", { name: "Instagram Reel Rate" });
      fireEvent.click(rateNameButton);

      // Change the value
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Updated Rate Name" } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockUpdateRateCard).toHaveBeenCalledWith("rate-1", { name: "Updated Rate Name" });
      });
    });

    it("calls updateRateCard on Enter key", async () => {
      mockUpdateRateCard.mockResolvedValue(undefined);
      render(<SavedRates />);

      // Enter edit mode
      const rateNameButton = screen.getByRole("button", { name: "Instagram Reel Rate" });
      fireEvent.click(rateNameButton);

      // Change the value and press Enter
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New Name" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(mockUpdateRateCard).toHaveBeenCalledWith("rate-1", { name: "New Name" });
      });
    });
  });

  describe("Action buttons in header", () => {
    beforeEach(() => {
      vi.mocked(useRateCards).mockReturnValue({
        rateCards: mockRateCards,
        isLoading: false,
        isError: false,
        deleteRateCard: mockDeleteRateCard,
        updateRateCard: mockUpdateRateCard,
        createRateCard: mockCreateRateCard,
      });
    });

    it("shows Quick Quote button in header when rates exist", () => {
      const mockOnQuickQuote = vi.fn();
      render(<SavedRates onQuickQuote={mockOnQuickQuote} />);

      // Should have the header Quick Quote button (not the empty state one)
      const quickQuoteButtons = screen.getAllByRole("button", { name: /Quick Quote|Quote/i });
      expect(quickQuoteButtons.length).toBeGreaterThan(0);
    });

    it("shows Upload Brief button in header when rates exist", () => {
      const mockOnUploadBrief = vi.fn();
      render(<SavedRates onUploadBrief={mockOnUploadBrief} />);

      // Should have the header Upload button
      const uploadButtons = screen.getAllByRole("button", { name: /Upload Brief|Upload/i });
      expect(uploadButtons.length).toBeGreaterThan(0);
    });
  });
});
