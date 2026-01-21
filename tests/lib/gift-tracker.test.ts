import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  GiftDeal,
  GiftDealStatus,
} from "@/lib/types";

// Mock the db module before importing gift-tracker
vi.mock("@/lib/db", () => ({
  db: {
    giftDeal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Import after mocking
import { db } from "@/lib/db";
import {
  createGiftDeal,
  getGiftDeals,
  getGiftDeal,
  updateGiftDeal,
  deleteGiftDeal,
  addContentToGiftDeal,
  addPerformanceToGiftDeal,
  logFollowUp,
  markAsConverted,
  markAsRejected,
  getGiftsByStatus,
  getReadyToConvert,
  getFollowUpsDue,
  getConversionRate,
  getGiftAnalytics,
  getConversionScript,
  suggestFollowUpScript,
} from "@/lib/gift-tracker";

describe("gift-tracker", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const createMockGiftDeal = (overrides?: Partial<GiftDeal>): GiftDeal => ({
    id: "gift-1",
    creatorId: "creator-1",
    brandName: "Test Brand",
    brandHandle: "@testbrand",
    brandWebsite: "https://testbrand.com",
    brandFollowers: 50000,
    productDescription: "Premium skincare set",
    productValue: 150,
    dateReceived: new Date("2025-01-01"),
    contentType: null,
    contentUrl: null,
    contentDate: null,
    views: null,
    likes: null,
    comments: null,
    saves: null,
    shares: null,
    status: "received" as GiftDealStatus,
    conversionStatus: null,
    convertedDealId: null,
    convertedAmount: null,
    followUpDate: null,
    followUpSent: false,
    notes: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  });

  const createMockPrismaGiftDeal = (overrides?: Partial<GiftDeal>) => {
    const deal = createMockGiftDeal(overrides);
    return {
      ...deal,
      contentType: deal.contentType as string | null,
      status: deal.status as string,
      conversionStatus: deal.conversionStatus as string | null,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // CRUD OPERATIONS TESTS
  // ==========================================================================

  describe("createGiftDeal", () => {
    it("creates a gift deal with required fields", async () => {
      const mockDeal = createMockPrismaGiftDeal();
      vi.mocked(db.giftDeal.create).mockResolvedValue(mockDeal);

      const result = await createGiftDeal("creator-1", {
        brandName: "Test Brand",
        productDescription: "Premium skincare set",
        productValue: 150,
      });

      expect(db.giftDeal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creatorId: "creator-1",
          brandName: "Test Brand",
          productDescription: "Premium skincare set",
          productValue: 150,
          status: "received",
        }),
      });

      expect(result.brandName).toBe("Test Brand");
      expect(result.status).toBe("received");
    });

    it("creates a gift deal with optional fields", async () => {
      const mockDeal = createMockPrismaGiftDeal({
        brandHandle: "@mybrand",
        brandWebsite: "https://mybrand.com",
        notes: "Initial notes",
      });
      vi.mocked(db.giftDeal.create).mockResolvedValue(mockDeal);

      await createGiftDeal("creator-1", {
        brandName: "Test Brand",
        productDescription: "Product",
        productValue: 100,
        brandHandle: "@mybrand",
        brandWebsite: "https://mybrand.com",
        notes: "Initial notes",
      });

      expect(db.giftDeal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          brandHandle: "@mybrand",
          brandWebsite: "https://mybrand.com",
          notes: "Initial notes",
        }),
      });
    });

    it("uses provided dateReceived or defaults to now", async () => {
      const mockDeal = createMockPrismaGiftDeal();
      vi.mocked(db.giftDeal.create).mockResolvedValue(mockDeal);

      await createGiftDeal("creator-1", {
        brandName: "Test Brand",
        productDescription: "Product",
        productValue: 100,
        dateReceived: "2025-01-15",
      });

      expect(db.giftDeal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dateReceived: new Date("2025-01-15"),
        }),
      });
    });
  });

  describe("getGiftDeals", () => {
    it("returns all gift deals for a creator", async () => {
      const mockDeals = [
        createMockPrismaGiftDeal({ id: "gift-1" }),
        createMockPrismaGiftDeal({ id: "gift-2", brandName: "Brand 2" }),
      ];
      vi.mocked(db.giftDeal.findMany).mockResolvedValue(mockDeals);

      const result = await getGiftDeals("creator-1");

      expect(db.giftDeal.findMany).toHaveBeenCalledWith({
        where: { creatorId: "creator-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("getGiftDeal", () => {
    it("returns a single gift deal", async () => {
      const mockDeal = createMockPrismaGiftDeal();
      vi.mocked(db.giftDeal.findFirst).mockResolvedValue(mockDeal);

      const result = await getGiftDeal("creator-1", "gift-1");

      expect(db.giftDeal.findFirst).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
      });
      expect(result?.id).toBe("gift-1");
    });

    it("returns null if not found", async () => {
      vi.mocked(db.giftDeal.findFirst).mockResolvedValue(null);

      const result = await getGiftDeal("creator-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateGiftDeal", () => {
    it("updates specified fields only", async () => {
      const mockDeal = createMockPrismaGiftDeal({ brandName: "Updated Brand" });
      vi.mocked(db.giftDeal.update).mockResolvedValue(mockDeal);

      await updateGiftDeal("creator-1", "gift-1", { brandName: "Updated Brand" });

      expect(db.giftDeal.update).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
        data: { brandName: "Updated Brand" },
      });
    });

    it("handles date conversion", async () => {
      const mockDeal = createMockPrismaGiftDeal();
      vi.mocked(db.giftDeal.update).mockResolvedValue(mockDeal);

      await updateGiftDeal("creator-1", "gift-1", {
        dateReceived: "2025-02-01",
        contentDate: "2025-02-05",
      });

      expect(db.giftDeal.update).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
        data: expect.objectContaining({
          dateReceived: new Date("2025-02-01"),
          contentDate: new Date("2025-02-05"),
        }),
      });
    });
  });

  describe("deleteGiftDeal", () => {
    it("deletes a gift deal", async () => {
      vi.mocked(db.giftDeal.delete).mockResolvedValue(createMockPrismaGiftDeal());

      await deleteGiftDeal("creator-1", "gift-1");

      expect(db.giftDeal.delete).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
      });
    });
  });

  // ==========================================================================
  // CONTENT & PERFORMANCE TESTS
  // ==========================================================================

  describe("addContentToGiftDeal", () => {
    it("adds content and updates status to content_created", async () => {
      const mockDeal = createMockPrismaGiftDeal({
        status: "content_created",
        contentType: "reel",
        contentUrl: "https://instagram.com/reel/123",
      });
      vi.mocked(db.giftDeal.update).mockResolvedValue(mockDeal);

      const result = await addContentToGiftDeal("creator-1", "gift-1", {
        contentType: "reel",
        contentUrl: "https://instagram.com/reel/123",
      });

      expect(db.giftDeal.update).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
        data: expect.objectContaining({
          contentType: "reel",
          status: "content_created",
          followUpDate: expect.any(Date), // 14 days from now
        }),
      });
      expect(result.status).toBe("content_created");
    });

    it("sets follow-up date 14 days from content date", async () => {
      const contentDate = new Date("2025-01-15");
      const expectedFollowUp = new Date("2025-01-29");

      const mockDeal = createMockPrismaGiftDeal();
      vi.mocked(db.giftDeal.update).mockResolvedValue(mockDeal);

      await addContentToGiftDeal("creator-1", "gift-1", {
        contentType: "post",
        contentDate,
      });

      const updateCall = vi.mocked(db.giftDeal.update).mock.calls[0][0];
      const followUpDate = updateCall.data.followUpDate as Date;

      expect(followUpDate.toISOString().slice(0, 10)).toBe(
        expectedFollowUp.toISOString().slice(0, 10)
      );
    });
  });

  describe("addPerformanceToGiftDeal", () => {
    it("adds performance metrics", async () => {
      const mockDeal = createMockPrismaGiftDeal({
        views: 10000,
        likes: 500,
        comments: 50,
        saves: 100,
        shares: 25,
      });
      vi.mocked(db.giftDeal.update).mockResolvedValue(mockDeal);

      const result = await addPerformanceToGiftDeal("creator-1", "gift-1", {
        views: 10000,
        likes: 500,
        comments: 50,
        saves: 100,
        shares: 25,
      });

      expect(db.giftDeal.update).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
        data: {
          views: 10000,
          likes: 500,
          comments: 50,
          saves: 100,
          shares: 25,
        },
      });
      expect(result.views).toBe(10000);
    });
  });

  // ==========================================================================
  // FOLLOW-UP & CONVERSION TESTS
  // ==========================================================================

  describe("logFollowUp", () => {
    it("logs follow-up and updates status", async () => {
      const existingDeal = createMockPrismaGiftDeal({ notes: "Previous notes" });
      vi.mocked(db.giftDeal.findFirst).mockResolvedValue(existingDeal);

      const updatedDeal = createMockPrismaGiftDeal({
        status: "followed_up",
        followUpSent: true,
        conversionStatus: "attempting",
      });
      vi.mocked(db.giftDeal.update).mockResolvedValue(updatedDeal);

      const result = await logFollowUp("creator-1", "gift-1", {
        notes: "Sent performance share",
      });

      expect(db.giftDeal.update).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
        data: expect.objectContaining({
          status: "followed_up",
          followUpSent: true,
          conversionStatus: "attempting",
        }),
      });
      expect(result.status).toBe("followed_up");
    });

    it("throws error if gift not found", async () => {
      vi.mocked(db.giftDeal.findFirst).mockResolvedValue(null);

      await expect(logFollowUp("creator-1", "nonexistent", {})).rejects.toThrow(
        "Gift deal not found"
      );
    });
  });

  describe("markAsConverted", () => {
    it("marks gift as converted with amount", async () => {
      const existingDeal = createMockPrismaGiftDeal();
      vi.mocked(db.giftDeal.findFirst).mockResolvedValue(existingDeal);

      const convertedDeal = createMockPrismaGiftDeal({
        status: "converted",
        conversionStatus: "converted",
        convertedAmount: 400,
      });
      vi.mocked(db.giftDeal.update).mockResolvedValue(convertedDeal);

      const result = await markAsConverted("creator-1", "gift-1", {
        convertedAmount: 400,
        notes: "Successful conversion!",
      });

      expect(db.giftDeal.update).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
        data: expect.objectContaining({
          status: "converted",
          conversionStatus: "converted",
          convertedAmount: 400,
        }),
      });
      expect(result.convertedAmount).toBe(400);
    });
  });

  describe("markAsRejected", () => {
    it("marks gift as rejected", async () => {
      const existingDeal = createMockPrismaGiftDeal();
      vi.mocked(db.giftDeal.findFirst).mockResolvedValue(existingDeal);

      const rejectedDeal = createMockPrismaGiftDeal({
        status: "declined",
        conversionStatus: "rejected",
      });
      vi.mocked(db.giftDeal.update).mockResolvedValue(rejectedDeal);

      const result = await markAsRejected(
        "creator-1",
        "gift-1",
        "Brand declined, no budget"
      );

      expect(db.giftDeal.update).toHaveBeenCalledWith({
        where: { id: "gift-1", creatorId: "creator-1" },
        data: expect.objectContaining({
          status: "declined",
          conversionStatus: "rejected",
        }),
      });
      expect(result.status).toBe("declined");
    });
  });

  // ==========================================================================
  // QUERY OPERATIONS TESTS
  // ==========================================================================

  describe("getGiftsByStatus", () => {
    it("returns gifts filtered by status", async () => {
      const mockDeals = [
        createMockPrismaGiftDeal({ id: "gift-1", status: "content_created" }),
        createMockPrismaGiftDeal({ id: "gift-2", status: "content_created" }),
      ];
      vi.mocked(db.giftDeal.findMany).mockResolvedValue(mockDeals);

      const result = await getGiftsByStatus("creator-1", "content_created");

      expect(db.giftDeal.findMany).toHaveBeenCalledWith({
        where: { creatorId: "creator-1", status: "content_created" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(2);
      expect(result.every((d) => d.status === "content_created")).toBe(true);
    });
  });

  describe("getReadyToConvert", () => {
    it("returns gifts with good performance ready to convert", async () => {
      const mockDeals = [
        createMockPrismaGiftDeal({
          id: "gift-1",
          status: "content_created",
          followUpSent: false,
          views: 10000,
          likes: 500,
          comments: 50,
          saves: 100,
          shares: 25,
        }),
      ];
      vi.mocked(db.giftDeal.findMany).mockResolvedValue(mockDeals);

      const result = await getReadyToConvert("creator-1");

      expect(db.giftDeal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            creatorId: "creator-1",
            status: "content_created",
            followUpSent: false,
          }),
        })
      );
      expect(result).toHaveLength(1);
    });

    it("filters out gifts with low engagement", async () => {
      const mockDeals = [
        createMockPrismaGiftDeal({
          id: "gift-1",
          status: "content_created",
          followUpSent: false,
          views: 100, // Low views
          likes: 5,
          comments: 1,
          saves: 1,
          shares: 0,
        }),
      ];
      vi.mocked(db.giftDeal.findMany).mockResolvedValue(mockDeals);

      const result = await getReadyToConvert("creator-1");

      // Engagement score: 100*0.001 + 5*0.1 + 1*0.5 + 1*0.3 + 0*0.2 = 1.4 < 50
      expect(result).toHaveLength(0);
    });
  });

  describe("getFollowUpsDue", () => {
    it("returns gifts with overdue follow-ups", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

      const mockDeals = [
        createMockPrismaGiftDeal({
          id: "gift-1",
          status: "content_created",
          followUpDate: pastDate,
          followUpSent: false,
        }),
      ];
      vi.mocked(db.giftDeal.findMany).mockResolvedValue(mockDeals);

      const result = await getFollowUpsDue("creator-1");

      expect(db.giftDeal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            creatorId: "creator-1",
            followUpSent: false,
          }),
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("getConversionRate", () => {
    it("calculates conversion rate correctly", async () => {
      vi.mocked(db.giftDeal.count)
        .mockResolvedValueOnce(10) // total non-archived
        .mockResolvedValueOnce(3); // converted

      const rate = await getConversionRate("creator-1");

      expect(rate).toBe(0.3); // 3/10 = 30%
    });

    it("returns 0 when no gifts", async () => {
      vi.mocked(db.giftDeal.count).mockResolvedValue(0);

      const rate = await getConversionRate("creator-1");

      expect(rate).toBe(0);
    });
  });

  // ==========================================================================
  // ANALYTICS TESTS
  // ==========================================================================

  describe("getGiftAnalytics", () => {
    it("calculates comprehensive analytics", async () => {
      const mockDeals = [
        createMockPrismaGiftDeal({
          id: "gift-1",
          status: "converted",
          productValue: 100,
          convertedAmount: 400,
          dateReceived: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-15"), // 14 days to convert
        }),
        createMockPrismaGiftDeal({
          id: "gift-2",
          status: "content_created",
          productValue: 150,
          contentType: "reel",
          followUpDate: new Date("2025-01-01"), // Past due
          followUpSent: false,
        }),
        createMockPrismaGiftDeal({
          id: "gift-3",
          status: "received",
          productValue: 200,
        }),
      ];
      vi.mocked(db.giftDeal.findMany).mockResolvedValue(mockDeals);

      const analytics = await getGiftAnalytics("creator-1");

      expect(analytics.totalGiftsReceived).toBe(3);
      expect(analytics.totalProductValue).toBe(450); // 100 + 150 + 200
      expect(analytics.giftsConverted).toBe(1);
      expect(analytics.conversionRate).toBeCloseTo(0.333, 2); // 1/3
      expect(analytics.revenueFromConverted).toBe(400);
      expect(analytics.roiOnGiftWork).toBeCloseTo(0.889, 2); // 400/450
      expect(analytics.giftsWithContent).toBe(1);
      expect(analytics.followUpsDue).toBe(1);
    });

    it("handles empty gift list", async () => {
      vi.mocked(db.giftDeal.findMany).mockResolvedValue([]);

      const analytics = await getGiftAnalytics("creator-1");

      expect(analytics.totalGiftsReceived).toBe(0);
      expect(analytics.conversionRate).toBe(0);
      expect(analytics.roiOnGiftWork).toBe(0);
    });
  });

  // ==========================================================================
  // CONVERSION SCRIPTS TESTS
  // ==========================================================================

  describe("getConversionScript", () => {
    it("generates performance_share script with metrics", () => {
      const giftDeal = createMockGiftDeal({
        brandName: "Test Brand",
        productDescription: "Skincare Set",
        views: 10500,
        likes: 850,
        saves: 125,
      });

      const script = getConversionScript(giftDeal, "performance_share");

      expect(script).toContain("Test Brand");
      expect(script).toContain("10.5K"); // formatted views
      expect(script).toContain("850"); // likes
      expect(script).toContain("125"); // saves
    });

    it("generates follow_up_30_day script", () => {
      const giftDeal = createMockGiftDeal({
        brandName: "Awesome Brand",
        productDescription: "Premium Product",
      });

      const script = getConversionScript(giftDeal, "follow_up_30_day");

      expect(script).toContain("Awesome Brand");
      expect(script).toContain("Premium Product");
      expect(script).toContain("15% returning brand discount");
    });

    it("generates new_launch_pitch script", () => {
      const giftDeal = createMockGiftDeal({
        brandName: "Launch Brand",
        productDescription: "Original Product",
      });

      const script = getConversionScript(giftDeal, "new_launch_pitch");

      expect(script).toContain("Launch Brand");
      expect(script).toContain("launching");
    });

    it("generates returning_brand_offer script", () => {
      const giftDeal = createMockGiftDeal({
        brandName: "Returning Brand",
      });

      const script = getConversionScript(giftDeal, "returning_brand_offer");

      expect(script).toContain("Returning Brand");
      expect(script).toContain("15% discount");
      expect(script).toContain("returning brands");
    });
  });

  describe("suggestFollowUpScript", () => {
    it("suggests performance_share for recent content", () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

      const giftDeal = createMockGiftDeal({
        contentDate: recentDate,
      });

      const suggestion = suggestFollowUpScript(giftDeal);

      expect(suggestion.stage).toBe("performance_share");
      expect(suggestion.reason).toContain("Perfect timing");
    });

    it("suggests follow_up_30_day for content 20 days old", () => {
      const olderDate = new Date();
      olderDate.setDate(olderDate.getDate() - 20); // 20 days ago

      const giftDeal = createMockGiftDeal({
        contentDate: olderDate,
      });

      const suggestion = suggestFollowUpScript(giftDeal);

      expect(suggestion.stage).toBe("follow_up_30_day");
      expect(suggestion.reason).toContain("30-day check-in");
    });

    it("suggests returning_brand_offer for old content", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago

      const giftDeal = createMockGiftDeal({
        contentDate: oldDate,
      });

      const suggestion = suggestFollowUpScript(giftDeal);

      expect(suggestion.stage).toBe("returning_brand_offer");
      expect(suggestion.reason).toContain("returning brand discount");
    });

    it("suggests performance_share when no content posted yet", () => {
      const giftDeal = createMockGiftDeal({
        contentDate: null,
      });

      const suggestion = suggestFollowUpScript(giftDeal);

      expect(suggestion.stage).toBe("performance_share");
      expect(suggestion.reason).toContain("Content not yet posted");
    });
  });

  // ==========================================================================
  // STATUS TRANSITION TESTS
  // ==========================================================================

  describe("status transitions", () => {
    const validTransitions: { from: GiftDealStatus; to: GiftDealStatus; action: string }[] = [
      { from: "received", to: "content_created", action: "addContent" },
      { from: "content_created", to: "followed_up", action: "logFollowUp" },
      { from: "followed_up", to: "converted", action: "markAsConverted" },
      { from: "followed_up", to: "declined", action: "markAsRejected" },
      { from: "content_created", to: "converted", action: "markAsConverted" },
      { from: "received", to: "converted", action: "markAsConverted" },
    ];

    validTransitions.forEach(({ from, to, action }) => {
      it(`transitions from ${from} to ${to} via ${action}`, async () => {
        const mockDeal = createMockPrismaGiftDeal({ status: from });
        vi.mocked(db.giftDeal.findFirst).mockResolvedValue(mockDeal);
        vi.mocked(db.giftDeal.update).mockResolvedValue(
          createMockPrismaGiftDeal({ status: to })
        );

        let result: GiftDeal;
        switch (action) {
          case "addContent":
            result = await addContentToGiftDeal("creator-1", "gift-1", {
              contentType: "post",
            });
            break;
          case "logFollowUp":
            result = await logFollowUp("creator-1", "gift-1", {});
            break;
          case "markAsConverted":
            result = await markAsConverted("creator-1", "gift-1", {
              convertedAmount: 400,
            });
            break;
          case "markAsRejected":
            result = await markAsRejected("creator-1", "gift-1");
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        expect(result.status).toBe(to);
      });
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe("edge cases", () => {
    it("handles gift with all null optional fields", async () => {
      const minimalDeal = createMockPrismaGiftDeal({
        brandHandle: null,
        brandWebsite: null,
        brandFollowers: null,
        contentType: null,
        contentUrl: null,
        contentDate: null,
        views: null,
        likes: null,
        comments: null,
        saves: null,
        shares: null,
        conversionStatus: null,
        convertedDealId: null,
        convertedAmount: null,
        followUpDate: null,
        notes: null,
      });
      vi.mocked(db.giftDeal.findFirst).mockResolvedValue(minimalDeal);

      const result = await getGiftDeal("creator-1", "gift-1");

      expect(result).not.toBeNull();
      expect(result?.brandHandle).toBeNull();
    });

    it("formats large view numbers correctly", () => {
      const giftDeal = createMockGiftDeal({
        views: 1500000,
        likes: 50000,
        saves: 5000,
      });

      const script = getConversionScript(giftDeal, "performance_share");

      expect(script).toContain("1.5M"); // 1.5M views
      expect(script).toContain("50.0K"); // 50K likes
    });

    it("handles zero metrics in script", () => {
      // When views is 0/null, the script keeps placeholder [X], [Y], [Z]
      // because the replacement only happens when views is truthy
      const giftDeal = createMockGiftDeal({
        views: 0,
        likes: 0,
        saves: 0,
      });

      const script = getConversionScript(giftDeal, "performance_share");

      // Script should still be generated (placeholders remain when views=0)
      expect(script).toContain("Results");
      expect(script).toContain("[X]"); // Placeholder not replaced when views=0
    });
  });
});
