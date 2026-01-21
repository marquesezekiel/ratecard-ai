import { describe, it, expect } from "vitest";
import {
  generateGiftResponse,
  generateResponseByType,
  getResponseTypeDescription,
  getConversionPlaybookScript,
} from "@/lib/gift-responses";
import type {
  GiftEvaluation,
  GiftResponseContext,
  GiftResponseType,
  GiftRecommendation,
} from "@/lib/types";

describe("gift-responses", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const createMockEvaluation = (
    recommendation: GiftRecommendation,
    overrides?: Partial<GiftEvaluation>
  ): GiftEvaluation => ({
    worthScore: 65,
    recommendation,
    analysis: {
      productValue: 150,
      yourTimeValue: 100,
      audienceValue: 6,
      totalValueProviding: 106,
      valueGap: 44,
      effectiveHourlyRate: 75,
    },
    strategicValue: {
      score: 7,
      portfolioWorth: true,
      conversionPotential: "high",
      brandReputationBoost: false,
      reasons: ["Established brand", "Previous creator collabs"],
    },
    minimumAcceptableAddOn: 50,
    suggestedCounterOffer: "Counter offer text",
    walkAwayPoint: "Walk away if...",
    acceptanceBoundaries: {
      maxContentType: "dedicated post as requested",
      timeLimit: "Standard post duration",
      rightsLimit: "No usage rights beyond your own post",
    },
    ...overrides,
  });

  const createMockContext = (overrides?: Partial<GiftResponseContext>): GiftResponseContext => ({
    brandName: "TestBrand",
    productName: "Premium Skincare Set",
    creatorRate: 400,
    hybridRate: 200,
    contentType: "dedicated post",
    ...overrides,
  });

  // ==========================================================================
  // generateGiftResponse TESTS
  // ==========================================================================

  describe("generateGiftResponse", () => {
    describe("accept_with_hook response", () => {
      it("generates accept response for accept_with_hook recommendation", () => {
        const evaluation = createMockEvaluation("accept_with_hook");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.responseType).toBe("accept_with_hook");
        expect(response.message).toContain("TestBrand");
        expect(response.message).toContain("love to try");
        expect(response.message).toContain("shipping info");
      });

      it("includes follow-up reminder", () => {
        const evaluation = createMockEvaluation("accept_with_hook");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.followUpReminder).toBeTruthy();
        expect(response.followUpReminder).toContain("reminder");
      });

      it("includes conversion script", () => {
        const evaluation = createMockEvaluation("accept_with_hook");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.conversionScript).toBeTruthy();
        expect(response.conversionScript).toContain("Results");
        expect(response.conversionScript).toContain("paid partnership");
      });
    });

    describe("counter_hybrid response", () => {
      it("generates counter response for counter_hybrid recommendation", () => {
        const evaluation = createMockEvaluation("counter_hybrid");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.responseType).toBe("counter_hybrid");
        expect(response.message).toContain("TestBrand");
        expect(response.message).toContain("hybrid");
        expect(response.message).toContain("$");
      });

      it("includes creator rate", () => {
        const evaluation = createMockEvaluation("counter_hybrid");
        const context = createMockContext({ creatorRate: 500 });
        const response = generateGiftResponse(evaluation, context);

        expect(response.message).toContain("$500");
      });

      it("includes hybrid rate", () => {
        const evaluation = createMockEvaluation("counter_hybrid", { minimumAcceptableAddOn: 250 });
        // Context already has hybridRate: 200, so it takes precedence
        const context = createMockContext({ hybridRate: undefined });
        const response = generateGiftResponse(evaluation, context);

        expect(response.message).toContain("$250");
      });

      it("includes follow-up reminder", () => {
        const evaluation = createMockEvaluation("counter_hybrid");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.followUpReminder).toBeTruthy();
        expect(response.followUpReminder).toContain("hybrid deal");
      });

      it("includes conversion script", () => {
        const evaluation = createMockEvaluation("counter_hybrid");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.conversionScript).toBeTruthy();
        expect(response.conversionScript).toContain("fully paid");
      });
    });

    describe("ask_budget_first response", () => {
      it("generates clarifying questions for ask_budget_first recommendation", () => {
        const evaluation = createMockEvaluation("ask_budget_first");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.responseType).toBe("ask_budget_first");
        expect(response.message).toContain("questions");
        expect(response.message).toContain("retail value");
        expect(response.message).toContain("deliverables");
        expect(response.message).toContain("budget");
      });

      it("has null follow-up reminder", () => {
        const evaluation = createMockEvaluation("ask_budget_first");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.followUpReminder).toBeNull();
      });

      it("has null conversion script", () => {
        const evaluation = createMockEvaluation("ask_budget_first");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.conversionScript).toBeNull();
      });
    });

    describe("decline_politely response", () => {
      it("generates polite decline for decline_politely recommendation", () => {
        const evaluation = createMockEvaluation("decline_politely");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.responseType).toBe("decline_politely");
        expect(response.message).toContain("Thanks");
        expect(response.message).toContain("paid partnerships");
        expect(response.message).toContain("future");
      });

      it("has null follow-up reminder", () => {
        const evaluation = createMockEvaluation("decline_politely");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.followUpReminder).toBeNull();
      });

      it("has null conversion script", () => {
        const evaluation = createMockEvaluation("decline_politely");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.conversionScript).toBeNull();
      });
    });

    describe("run_away response", () => {
      it("generates minimal response for run_away recommendation", () => {
        const evaluation = createMockEvaluation("run_away");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.responseType).toBe("run_away");
        expect(response.message).toContain("right fit");
        expect(response.message.length).toBeLessThan(200);
      });

      it("has null follow-up reminder", () => {
        const evaluation = createMockEvaluation("run_away");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.followUpReminder).toBeNull();
      });

      it("has null conversion script", () => {
        const evaluation = createMockEvaluation("run_away");
        const context = createMockContext();
        const response = generateGiftResponse(evaluation, context);

        expect(response.conversionScript).toBeNull();
      });
    });

    describe("context handling", () => {
      it("uses brand name from context", () => {
        const evaluation = createMockEvaluation("accept_with_hook");
        const context = createMockContext({ brandName: "AwesomeBrand" });
        const response = generateGiftResponse(evaluation, context);

        expect(response.message).toContain("AwesomeBrand");
      });

      it("uses default brand name when not provided", () => {
        const evaluation = createMockEvaluation("accept_with_hook");
        const context = createMockContext({ brandName: undefined });
        const response = generateGiftResponse(evaluation, context);

        expect(response.message).toContain("there");
      });

      it("uses product name from context", () => {
        const evaluation = createMockEvaluation("accept_with_hook");
        const context = createMockContext({ productName: "Amazing Serum" });
        const response = generateGiftResponse(evaluation, context);

        expect(response.message).toContain("Amazing Serum");
      });

      it("uses hybrid rate from evaluation when not in context", () => {
        const evaluation = createMockEvaluation("counter_hybrid", { minimumAcceptableAddOn: 175 });
        const context = createMockContext({ hybridRate: undefined });
        const response = generateGiftResponse(evaluation, context);

        expect(response.message).toContain("$175");
      });
    });
  });

  // ==========================================================================
  // generateResponseByType TESTS
  // ==========================================================================

  describe("generateResponseByType", () => {
    const responseTypes: GiftResponseType[] = [
      "accept_with_hook",
      "counter_hybrid",
      "ask_budget_first",
      "decline_politely",
      "run_away",
    ];

    responseTypes.forEach((type) => {
      it(`generates ${type} response directly`, () => {
        const context = createMockContext();
        const response = generateResponseByType(type, context);

        expect(response.responseType).toBe(type);
        expect(response.message).toBeTruthy();
      });
    });

    it("generates different messages for different types", () => {
      const context = createMockContext();

      const acceptResponse = generateResponseByType("accept_with_hook", context);
      const declineResponse = generateResponseByType("decline_politely", context);

      expect(acceptResponse.message).not.toBe(declineResponse.message);
    });

    it("applies context to direct type generation", () => {
      const context = createMockContext({ brandName: "CustomBrand" });
      const response = generateResponseByType("accept_with_hook", context);

      expect(response.message).toContain("CustomBrand");
    });
  });

  // ==========================================================================
  // getResponseTypeDescription TESTS
  // ==========================================================================

  describe("getResponseTypeDescription", () => {
    it("returns title and description for accept_with_hook", () => {
      const desc = getResponseTypeDescription("accept_with_hook");
      expect(desc.title).toBeTruthy();
      expect(desc.description).toBeTruthy();
      expect(desc.description).toContain("Accept");
    });

    it("returns title and description for counter_hybrid", () => {
      const desc = getResponseTypeDescription("counter_hybrid");
      expect(desc.title).toBeTruthy();
      expect(desc.description).toContain("payment");
    });

    it("returns title and description for ask_budget_first", () => {
      const desc = getResponseTypeDescription("ask_budget_first");
      expect(desc.title).toBeTruthy();
      expect(desc.description).toContain("information");
    });

    it("returns title and description for decline_politely", () => {
      const desc = getResponseTypeDescription("decline_politely");
      expect(desc.title).toBeTruthy();
      expect(desc.description).toContain("Pass");
    });

    it("returns title and description for run_away", () => {
      const desc = getResponseTypeDescription("run_away");
      expect(desc.title).toBeTruthy();
      expect(desc.description).toContain("Red flags");
    });

    it("has different titles for each type", () => {
      const types: GiftResponseType[] = [
        "accept_with_hook",
        "counter_hybrid",
        "ask_budget_first",
        "decline_politely",
        "run_away",
      ];

      const titles = types.map((t) => getResponseTypeDescription(t).title);
      const uniqueTitles = new Set(titles);

      expect(uniqueTitles.size).toBe(types.length);
    });
  });

  // ==========================================================================
  // getConversionPlaybookScript TESTS
  // ==========================================================================

  describe("getConversionPlaybookScript", () => {
    const context = createMockContext();

    describe("performance_share stage", () => {
      it("generates performance share script", () => {
        const script = getConversionPlaybookScript("performance_share", context);

        expect(script).toContain("Results");
        expect(script).toContain("views");
        expect(script).toContain("likes");
        expect(script).toContain("saves");
        expect(script).toContain("rate card");
      });

      it("includes brand and product names", () => {
        const script = getConversionPlaybookScript("performance_share", context);

        expect(script).toContain("TestBrand");
        expect(script).toContain("Premium Skincare Set");
      });
    });

    describe("follow_up_30_day stage", () => {
      it("generates 30-day follow-up script", () => {
        const script = getConversionPlaybookScript("follow_up_30_day", context);

        expect(script).toContain("month");
        expect(script).toContain("15%");
        expect(script).toContain("returning brand discount");
      });

      it("includes brand and product names", () => {
        const script = getConversionPlaybookScript("follow_up_30_day", context);

        expect(script).toContain("TestBrand");
        expect(script).toContain("Premium Skincare Set");
      });
    });

    describe("new_launch_pitch stage", () => {
      it("generates new launch pitch script", () => {
        const script = getConversionPlaybookScript("new_launch_pitch", context);

        expect(script).toContain("launching");
        expect(script).toContain("congrats");
        expect(script).toContain("15% discount");
      });

      it("references previous product", () => {
        const script = getConversionPlaybookScript("new_launch_pitch", context);

        expect(script).toContain("Premium Skincare Set");
      });
    });

    describe("returning_brand_offer stage", () => {
      it("generates returning brand offer script", () => {
        const script = getConversionPlaybookScript("returning_brand_offer", context);

        expect(script).toContain("returning brands");
        expect(script).toContain("15% discount");
        expect(script).toContain("Priority scheduling");
        expect(script).toContain("rate card");
      });

      it("includes brand name", () => {
        const script = getConversionPlaybookScript("returning_brand_offer", context);

        expect(script).toContain("TestBrand");
      });
    });

    describe("context handling", () => {
      it("uses default brand name when not provided", () => {
        const contextWithoutBrand = createMockContext({ brandName: undefined });
        const script = getConversionPlaybookScript("performance_share", contextWithoutBrand);

        expect(script).toContain("there");
      });

      it("uses default product name when not provided", () => {
        const contextWithoutProduct = createMockContext({ productName: undefined });
        const script = getConversionPlaybookScript("performance_share", contextWithoutProduct);

        expect(script).toContain("your product");
      });
    });

    describe("all stages produce valid scripts", () => {
      const stages = [
        "performance_share",
        "follow_up_30_day",
        "new_launch_pitch",
        "returning_brand_offer",
      ] as const;

      stages.forEach((stage) => {
        it(`produces valid script for ${stage}`, () => {
          const script = getConversionPlaybookScript(stage, context);

          expect(script).toBeTruthy();
          expect(script.length).toBeGreaterThan(50);
          expect(script).toContain("Hi");
        });
      });
    });
  });

  // ==========================================================================
  // RESPONSE QUALITY TESTS
  // ==========================================================================

  describe("response quality", () => {
    it("responses are professional and friendly", () => {
      const context = createMockContext();
      const evaluation = createMockEvaluation("accept_with_hook");
      const response = generateGiftResponse(evaluation, context);

      // Should not contain unprofessional language
      expect(response.message.toLowerCase()).not.toContain("hey babe");
      expect(response.message.toLowerCase()).not.toContain("omg");
      expect(response.message.toLowerCase()).not.toContain("!!!!");
    });

    it("decline responses maintain professionalism", () => {
      const context = createMockContext();
      const evaluation = createMockEvaluation("decline_politely");
      const response = generateGiftResponse(evaluation, context);

      expect(response.message).toContain("Thanks");
      expect(response.message).toContain("appreciate");
    });

    it("run_away response is brief but polite", () => {
      const context = createMockContext();
      const evaluation = createMockEvaluation("run_away");
      const response = generateGiftResponse(evaluation, context);

      expect(response.message).toContain("Thank you");
      expect(response.message.length).toBeLessThan(200);
    });

    it("counter responses explain value proposition", () => {
      const context = createMockContext();
      const evaluation = createMockEvaluation("counter_hybrid");
      const response = generateGiftResponse(evaluation, context);

      expect(response.message).toContain("high-quality content");
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("edge cases", () => {
    it("handles empty context", () => {
      const evaluation = createMockEvaluation("accept_with_hook");
      const response = generateGiftResponse(evaluation, {});

      expect(response.message).toBeTruthy();
      expect(response.responseType).toBe("accept_with_hook");
    });

    it("handles zero hybrid rate", () => {
      const evaluation = createMockEvaluation("counter_hybrid", { minimumAcceptableAddOn: 0 });
      const context = createMockContext({ hybridRate: 0 });
      const response = generateGiftResponse(evaluation, context);

      expect(response.message).toBeTruthy();
    });

    it("handles very long brand name", () => {
      const longBrandName = "A".repeat(100);
      const context = createMockContext({ brandName: longBrandName });
      const evaluation = createMockEvaluation("accept_with_hook");
      const response = generateGiftResponse(evaluation, context);

      expect(response.message).toContain(longBrandName);
    });

    it("handles special characters in brand name", () => {
      const context = createMockContext({ brandName: "Brand™ & Co." });
      const evaluation = createMockEvaluation("accept_with_hook");
      const response = generateGiftResponse(evaluation, context);

      expect(response.message).toContain("Brand™ & Co.");
    });

    it("handles very high rates", () => {
      const context = createMockContext({ creatorRate: 10000, hybridRate: 5000 });
      const evaluation = createMockEvaluation("counter_hybrid");
      const response = generateGiftResponse(evaluation, context);

      expect(response.message).toContain("$10000");
    });
  });
});
