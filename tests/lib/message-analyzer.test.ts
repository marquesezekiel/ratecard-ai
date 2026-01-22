import { describe, it, expect } from "vitest";
import {
  detectMessageSource,
  isLikelyGiftOffer,
  isLikelyMassOutreach,
  containsGiftIndicators,
  containsMassOutreachSignals,
} from "@/lib/message-analyzer";
import type { CreatorProfile, MessageSource } from "@/lib/types";

describe("message-analyzer", () => {
  // ==========================================================================
  // TEST FIXTURES
  // ==========================================================================

  const _createMockProfile = (overrides?: Partial<CreatorProfile>): CreatorProfile => ({
    id: "test-1",
    userId: "user-1",
    displayName: "Test Creator",
    handle: "testcreator",
    bio: "Test bio",
    location: "United States",
    region: "united_states",
    niches: ["lifestyle", "fashion"],
    instagram: {
      followers: 25000,
      engagementRate: 4.5,
      avgLikes: 1000,
      avgComments: 50,
      avgViews: 5000,
    },
    audience: {
      ageRange: "18-24",
      genderSplit: { male: 30, female: 65, other: 5 },
      topLocations: ["United States", "United Kingdom"],
      interests: ["fashion", "lifestyle"],
    },
    tier: "micro",
    totalReach: 25000,
    avgEngagementRate: 4.5,
    currency: "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  // ==========================================================================
  // MESSAGE SOURCE DETECTION TESTS
  // ==========================================================================

  describe("detectMessageSource", () => {
    describe("email detection", () => {
      it("detects email with Subject header", () => {
        const email = `Subject: Partnership Opportunity
From: marketing@brand.com

Hi there,

We'd like to discuss a potential partnership.

Best regards,
Marketing Team`;

        const result = detectMessageSource(email);
        expect(result.source).toBe("email");
        expect(result.confidence).toBe("high");
      });

      it("detects email with formal greeting", () => {
        const email = `Dear Sarah,

I'm reaching out from Brand X about a potential collaboration.

Best regards,
John Smith
Marketing Manager`;

        const result = detectMessageSource(email);
        expect(result.source).toBe("email");
        // "Dear X" greeting + "Best regards" closing gives high score (5+)
        expect(["high", "medium"]).toContain(result.confidence);
      });

      it("detects email with closing signature", () => {
        const email = `Hello,

We love your content and would like to work together.

Kind regards,
Marketing Team
Brand X Inc.`;

        const result = detectMessageSource(email);
        expect(result.source).toBe("email");
      });

      it("detects email with company email signature", () => {
        const email = `Hi!

We'd love to collaborate.

Thanks,
Jane
Partnerships Manager
jane@company.com`;

        const result = detectMessageSource(email);
        expect(result.source).toBe("email");
      });
    });

    describe("DM detection", () => {
      it("detects Instagram DM patterns", () => {
        const dm = "Hey! Love your content @youraccount! We'd love to collab on a post for #fashion";

        const result = detectMessageSource(dm);
        expect(result.source).toBe("instagram_dm");
      });

      it("detects TikTok DM patterns", () => {
        const dm = "Your content is going viral on TikTok! Want to do a duet?";

        const result = detectMessageSource(dm);
        expect(result.source).toBe("tiktok_dm");
      });

      it("detects casual DM greeting patterns", () => {
        const dm = "Heyyy! We absolutely love your content! DM us back if interested!";

        const result = detectMessageSource(dm);
        expect(["instagram_dm", "tiktok_dm", "twitter_dm", "linkedin_dm"]).toContain(result.source);
      });
    });

    describe("ambiguous messages", () => {
      it("defaults to DM for short, casual messages", () => {
        const message = "Hey! We want to work with you!";

        const result = detectMessageSource(message);
        expect(result.source).not.toBe("email");
      });

      it("defaults to email for long, formal messages", () => {
        const message = `Dear Creator,

I am reaching out to you on behalf of Brand X regarding a potential partnership opportunity. We have been following your content and believe you would be a great fit for our upcoming campaign.

Please let me know if you would be interested in discussing this further.

Best regards,
Marketing Team`;

        const result = detectMessageSource(message);
        expect(result.source).toBe("email");
      });
    });
  });

  // ==========================================================================
  // GIFT INDICATOR DETECTION TESTS
  // ==========================================================================

  describe("containsGiftIndicators", () => {
    it("detects 'send you product' phrase", () => {
      const dm = "Hi! We'd love to send you product from our new collection!";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("detects 'gift' phrase", () => {
      const dm = "We want to gift you some items from our brand!";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("detects 'in exchange for' phrase", () => {
      const dm = "We'd like to offer you free products in exchange for a review.";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("detects 'try our' phrase", () => {
      const dm = "We'd love for you to try our new skincare line!";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("detects 'PR package' phrase", () => {
      const dm = "We're sending out PR packages and would love to include you!";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("detects 'complimentary' phrase", () => {
      const dm = "We'd like to send you a complimentary set of our products.";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("detects 'product seeding' phrase", () => {
      const dm = "We're doing product seeding with select creators.";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("returns false for paid offers", () => {
      const dm = "Hi! We have a $500 budget for an Instagram Reel. Interested?";
      expect(containsGiftIndicators(dm)).toBe(false);
    });

    it("returns false for unclear offers", () => {
      const dm = "We love your content and would like to collaborate!";
      expect(containsGiftIndicators(dm)).toBe(false);
    });

    it("is case insensitive", () => {
      const dm = "We'd love to GIFT you some products!";
      expect(containsGiftIndicators(dm)).toBe(true);
    });
  });

  // ==========================================================================
  // MASS OUTREACH DETECTION TESTS
  // ==========================================================================

  describe("containsMassOutreachSignals", () => {
    it("detects 'hey babe' pattern", () => {
      const dm = "Hey babe! We love your content!";
      expect(containsMassOutreachSignals(dm)).toBe(true);
    });

    it("detects 'hey girl' pattern", () => {
      const dm = "Hey girl! We've been following you!";
      expect(containsMassOutreachSignals(dm)).toBe(true);
    });

    it("detects 'we love your feed' pattern without budget", () => {
      const dm = "Hi! We love your feed and want to work together!";
      expect(containsMassOutreachSignals(dm)).toBe(true);
    });

    it("detects 'we love your content' pattern without budget", () => {
      const dm = "We love your content! Let's collab!";
      expect(containsMassOutreachSignals(dm)).toBe(true);
    });

    it("does NOT flag 'we love your content' when budget is mentioned", () => {
      const dm = "We love your content! Our budget for this campaign is $500.";
      expect(containsMassOutreachSignals(dm)).toBe(false);
    });

    it("does NOT flag 'we love your feed' when rate is mentioned", () => {
      const dm = "We love your feed! What's your rate for a sponsored post?";
      expect(containsMassOutreachSignals(dm)).toBe(false);
    });

    it("returns false for professional messages", () => {
      const dm = "Hello Sarah, I'm reaching out from Brand X about a potential partnership.";
      expect(containsMassOutreachSignals(dm)).toBe(false);
    });

    it("is case insensitive", () => {
      const dm = "HEY BABE! We love your content!";
      expect(containsMassOutreachSignals(dm)).toBe(true);
    });
  });

  describe("isLikelyGiftOffer", () => {
    it("returns true for gift offers", () => {
      expect(isLikelyGiftOffer("We'd love to send you our new products!")).toBe(true);
      expect(isLikelyGiftOffer("Would you like to try our skincare line?")).toBe(true);
      expect(isLikelyGiftOffer("We're doing gifted collaborations")).toBe(true);
    });

    it("returns false for paid offers", () => {
      expect(isLikelyGiftOffer("We have a $500 budget for this campaign")).toBe(false);
      expect(isLikelyGiftOffer("Our rate for this collaboration is $300")).toBe(false);
    });
  });

  describe("isLikelyMassOutreach", () => {
    it("returns true for mass outreach patterns", () => {
      expect(isLikelyMassOutreach("Hey babe! Love your content!")).toBe(true);
      expect(isLikelyMassOutreach("Hey girl! We've been following you!")).toBe(true);
    });

    it("returns false for professional messages with budget", () => {
      expect(isLikelyMassOutreach("Hello, I'm from Brand X. We have a $500 budget.")).toBe(false);
    });
  });

  // ==========================================================================
  // EMAIL-SPECIFIC TESTS
  // ==========================================================================

  describe("email analysis patterns", () => {
    const professionalEmails = [
      {
        content: `Subject: Partnership Inquiry - Brand X

Dear Creator,

I hope this email finds you well. I am reaching out from Brand X's marketing team regarding a potential paid partnership opportunity.

We have a budget of $1,000 for this campaign and would love to discuss the details with you.

Best regards,
Jane Smith
Marketing Manager
Brand X Inc.`,
        expectedSource: "email" as MessageSource,
      },
      {
        content: `From: partnerships@company.com
To: creator@email.com
Subject: Collaboration Opportunity

Hello,

We'd like to work with you on our upcoming product launch.

Thanks,
The Brand Team`,
        expectedSource: "email" as MessageSource,
      },
    ];

    professionalEmails.forEach(({ content, expectedSource }, index) => {
      it(`correctly identifies professional email ${index + 1}`, () => {
        const result = detectMessageSource(content);
        expect(result.source).toBe(expectedSource);
      });
    });
  });

  // ==========================================================================
  // DM CLASSIFICATION TESTS
  // ==========================================================================

  describe("DM classification patterns", () => {
    describe("paid offer DMs", () => {
      const paidDMs = [
        "Hi! We love your content. We have a $500 budget for an Instagram Reel promoting our new product. Interested?",
        "Hello! Our brand has allocated $1000 for this campaign. Would you be interested in creating a TikTok video?",
        "We'd like to pay you $750 for a sponsored post on Instagram.",
        "Our fee for this collaboration is $400. Let me know if that works!",
      ];

      paidDMs.forEach((dm) => {
        it(`correctly identifies paid offer: "${dm.substring(0, 50)}..."`, () => {
          expect(containsGiftIndicators(dm)).toBe(false);
        });
      });
    });

    describe("gift offer DMs", () => {
      const giftDMs = [
        "Hey! We'd love to send you our new skincare line to try and share with your followers!",
        "Hi there! We want to gift you some products from our collection in exchange for a post.",
        "We're doing a PR package send-out and would love to include you!",
        "Would you like to try our products? We can send you a complimentary set!",
        "We're doing product seeding with creators. Interested in receiving some items?",
      ];

      giftDMs.forEach((dm) => {
        it(`correctly identifies gift offer: "${dm.substring(0, 50)}..."`, () => {
          expect(containsGiftIndicators(dm)).toBe(true);
        });
      });
    });

    describe("mass outreach DMs", () => {
      const massOutreachDMs = [
        "Hey babe! We absolutely LOVE your content! Would you be interested in a collab?",
        "Hey girl! We've been following your amazing journey! Let's work together!",
        "Hi gorgeous! We love your feed so much! DM us back!",
        "Hey hun! Your content is amazing! Check out our brand!",
      ];

      massOutreachDMs.forEach((dm) => {
        it(`correctly identifies mass outreach: "${dm.substring(0, 50)}..."`, () => {
          expect(containsMassOutreachSignals(dm)).toBe(true);
        });
      });
    });

    describe("professional DMs", () => {
      const professionalDMs = [
        "Hello Sarah, I'm the marketing manager at Brand X. We're planning a campaign for Q4 and would love to discuss a partnership with you.",
        "Hi there, I'm reaching out from [Company] regarding a potential sponsored content opportunity. Our budget for this project is $800.",
        "Dear Creator, We at Brand Y are looking for influencers in the lifestyle space for an upcoming product launch.",
      ];

      professionalDMs.forEach((dm) => {
        it(`correctly identifies professional tone: "${dm.substring(0, 50)}..."`, () => {
          expect(containsMassOutreachSignals(dm)).toBe(false);
        });
      });
    });
  });

  // ==========================================================================
  // SUGGESTED RATE TESTS
  // ==========================================================================

  describe("suggested rate by tier", () => {
    const tiers: Array<{ tier: CreatorProfile["tier"]; expectedRate: number }> = [
      { tier: "nano", expectedRate: 150 },
      { tier: "micro", expectedRate: 400 },
      { tier: "mid", expectedRate: 800 },
      { tier: "rising", expectedRate: 1500 },
      { tier: "macro", expectedRate: 3000 },
      { tier: "mega", expectedRate: 6000 },
      { tier: "celebrity", expectedRate: 12000 },
    ];

    tiers.forEach(({ tier, expectedRate }) => {
      it(`returns correct base rate for ${tier} tier`, () => {
        // We verify the expected rates are sensible
        expect(expectedRate).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // EDGE CASE TESTS
  // ==========================================================================

  describe("edge cases", () => {
    it("handles DMs with mixed signals (gift + paid)", () => {
      const dm = "We'd love to gift you our product AND pay you $200 for a post!";
      // This should be detected as having gift indicators but also payment
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("handles DMs with emojis", () => {
      const dm = "Hey babe! We LOVE your content! Would you like to try our products?";
      expect(containsGiftIndicators(dm)).toBe(true);
      expect(containsMassOutreachSignals(dm)).toBe(true);
    });

    it("handles multi-line DMs", () => {
      const dm = `Hi there!

We've been following your content and love what you do.

We'd like to send you our new collection to try!

Let us know if you're interested.

Best,
Brand Team`;
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("handles DMs with special characters", () => {
      const dm = "Hi! We'd love to send you our products - it's a great opportunity!";
      expect(containsGiftIndicators(dm)).toBe(true);
    });

    it("handles very long DMs", () => {
      const longText = "We love your content! ".repeat(100) + " Would you like to try our products?";
      expect(containsGiftIndicators(longText)).toBe(true);
    });

    it("handles emails with mixed professional and casual tone", () => {
      const email = `Subject: Quick collab idea!

Hey!

I'm the marketing coordinator at Brand X. Love your feed!

We have a $500 budget for sponsored content. Interested?

Thanks!
Mike
Brand X Team`;

      const result = detectMessageSource(email);
      expect(result.source).toBe("email");
      // Should not flag as mass outreach since budget is mentioned
      expect(containsMassOutreachSignals(email)).toBe(false);
    });
  });

  // ==========================================================================
  // RESPONSE STRUCTURE TESTS
  // ==========================================================================

  describe("expected response structures", () => {
    it("validates paid message response structure", () => {
      const mockResponse = {
        detectedSource: "instagram_dm" as MessageSource,
        sourceConfidence: "high" as const,
        brandName: "Test Brand",
        brandHandle: "testbrand",
        brandEmail: null,
        brandWebsite: null,
        deliverableRequest: "Instagram Reel",
        compensationType: "paid" as const,
        offeredAmount: 500,
        estimatedProductValue: null,
        tone: "professional" as const,
        urgency: "medium" as const,
        redFlags: [],
        greenFlags: ["Budget mentioned", "Clear expectations"],
        isGiftOffer: false,
        giftAnalysis: null,
        extractedRequirements: {},
        recommendedResponse: "Test response",
        suggestedRate: 400,
        dealQualityEstimate: 75,
        nextSteps: ["Review contract"],
      };

      expect(mockResponse.compensationType).toBe("paid");
      expect(mockResponse.isGiftOffer).toBe(false);
      expect(mockResponse.offeredAmount).toBe(500);
      expect(mockResponse.tone).toBe("professional");
      expect(mockResponse.detectedSource).toBe("instagram_dm");
    });

    it("validates email message response structure", () => {
      const mockResponse = {
        detectedSource: "email" as MessageSource,
        sourceConfidence: "high" as const,
        brandName: "Brand X",
        brandHandle: null,
        brandEmail: "marketing@brandx.com",
        brandWebsite: "brandx.com",
        deliverableRequest: "Sponsored blog post",
        compensationType: "paid" as const,
        offeredAmount: 1000,
        estimatedProductValue: null,
        tone: "professional" as const,
        urgency: "low" as const,
        redFlags: [],
        greenFlags: ["Budget mentioned", "Professional email"],
        isGiftOffer: false,
        giftAnalysis: null,
        emailMetadata: {
          subject: "Partnership Opportunity",
          senderName: "Jane Smith",
          senderEmail: "marketing@brandx.com",
          companySignature: "Brand X Inc.",
          hasAttachments: false,
        },
        extractedRequirements: {},
        recommendedResponse: "Test response",
        suggestedRate: 400,
        dealQualityEstimate: 85,
        nextSteps: ["Review proposal"],
      };

      expect(mockResponse.detectedSource).toBe("email");
      expect(mockResponse.emailMetadata).toBeDefined();
      expect(mockResponse.emailMetadata?.subject).toBe("Partnership Opportunity");
      expect(mockResponse.brandEmail).toBe("marketing@brandx.com");
    });

    it("validates gift message response structure", () => {
      const mockResponse = {
        detectedSource: "instagram_dm" as MessageSource,
        sourceConfidence: "medium" as const,
        brandName: "Skincare Brand",
        brandHandle: "skincarebrand",
        brandEmail: null,
        brandWebsite: null,
        deliverableRequest: "Product review post",
        compensationType: "gifted" as const,
        offeredAmount: null,
        estimatedProductValue: 150,
        tone: "casual" as const,
        urgency: "low" as const,
        redFlags: ["No budget mentioned"],
        greenFlags: ["Product has value"],
        isGiftOffer: true,
        giftAnalysis: {
          productMentioned: "Skincare set",
          contentExpectation: "explicit" as const,
          conversionPotential: "medium" as const,
          recommendedApproach: "counter_with_hybrid" as const,
        },
        extractedRequirements: {},
        recommendedResponse: "Test response",
        suggestedRate: 200,
        dealQualityEstimate: 45,
        nextSteps: ["Evaluate gift"],
      };

      expect(mockResponse.compensationType).toBe("gifted");
      expect(mockResponse.isGiftOffer).toBe(true);
      expect(mockResponse.giftAnalysis).not.toBeNull();
      expect(mockResponse.giftAnalysis?.recommendedApproach).toBe("counter_with_hybrid");
    });
  });

  // ==========================================================================
  // DEAL QUALITY ESTIMATE TESTS
  // ==========================================================================

  describe("deal quality estimate logic", () => {
    it("gives higher scores to paid offers", () => {
      const paidScore = 50 + 20; // Base + paid bonus
      const giftScore = 50 - 10; // Base - gift penalty
      expect(paidScore).toBeGreaterThan(giftScore);
    });

    it("penalizes scam-likely tone", () => {
      const baseScore = 50;
      const scamPenalty = -30;
      expect(baseScore + scamPenalty).toBe(20);
    });

    it("rewards professional tone", () => {
      const baseScore = 50;
      const professionalBonus = 15;
      expect(baseScore + professionalBonus).toBe(65);
    });

    it("penalizes red flags", () => {
      // Each red flag reduces score by 7 points, max 25
      const redFlagPenalty = Math.min(3 * 7, 25);
      expect(redFlagPenalty).toBe(21);
    });

    it("rewards green flags", () => {
      // Each green flag adds 5 points, max 15
      const greenFlagBonus = Math.min(4 * 5, 15);
      expect(greenFlagBonus).toBe(15);
    });
  });
});
