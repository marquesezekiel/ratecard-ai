/**
 * FTC Disclosure Guidance Module
 *
 * Provides FTC disclosure guidance to help creators stay compliant.
 * FTC violations can cost up to $50,000+ per violation.
 *
 * Key principles:
 * - All sponsored content must be clearly disclosed
 * - Disclosure must be clear, conspicuous, and unavoidable
 * - Different platforms have different disclosure methods
 * - Gift products and affiliate links also require disclosure
 */

import type {
  Platform,
  DealType,
  CompensationType,
  PlatformDisclosureGuidance,
  ContentDisclosureRule,
  AIDisclosureGuidance,
  FTCChecklistItem,
  FTCGuidance,
} from "./types";

// Re-export types for convenience
export type { CompensationType, PlatformDisclosureGuidance, ContentDisclosureRule, AIDisclosureGuidance, FTCChecklistItem, FTCGuidance };

// =============================================================================
// PLATFORM-SPECIFIC GUIDANCE
// =============================================================================

const PLATFORM_GUIDANCE: Record<Platform, PlatformDisclosureGuidance> = {
  instagram: {
    platform: "instagram",
    platformName: "Instagram",
    builtInTools: [
      "Paid partnership label (tap 'Add label' in post settings)",
      "Branded content tools for business accounts",
    ],
    requiredDisclosure: "#ad in caption",
    recommendations: [
      "Use the 'Paid partnership with [Brand]' tag for all sponsored posts",
      "Place #ad at the very beginning of your caption",
      "Ensure disclosure is visible without clicking 'more'",
      "For Stories, use the 'Paid partnership' sticker",
      "For Reels, add disclosure in first frame AND caption",
    ],
    mistakes: [
      "Burying #ad at the end or among many hashtags",
      "Using #sp, #spon, or #collab instead of #ad or #sponsored",
      "Only using Stories sticker without caption disclosure on feed posts",
      "Making disclosure text too small or same color as background",
    ],
  },
  tiktok: {
    platform: "tiktok",
    platformName: "TikTok",
    builtInTools: [
      "Content disclosure settings ('Disclose paid content')",
      "Promotional content toggle in post settings",
    ],
    requiredDisclosure: "Verbal mention + #ad in caption",
    recommendations: [
      "Use TikTok's 'Disclose paid content' toggle when posting",
      "Say 'This is a paid partnership' or 'ad' verbally in the video",
      "Add #ad in the first line of your caption",
      "Keep verbal disclosure in first few seconds",
      "Don't rely solely on the platform label - say it out loud",
    ],
    mistakes: [
      "Only using platform label without verbal mention",
      "Saying disclosure too quickly or mumbling",
      "Placing written disclosure after the 'see more' cut-off",
      "Using unclear phrases like 'thanks to' without #ad",
    ],
  },
  youtube: {
    platform: "youtube",
    platformName: "YouTube",
    builtInTools: [
      "Video contains paid promotion checkbox in video details",
      "Automatic disclosure banner at start of video",
    ],
    requiredDisclosure: "Check 'Includes paid promotion' + verbal disclosure",
    recommendations: [
      "Always check the 'Video contains paid promotion' box",
      "Say 'This video is sponsored by [Brand]' within first 30 seconds",
      "Add disclosure in video description",
      "For YouTube Shorts, verbal disclosure is essential",
      "Include written disclosure in pinned comment",
    ],
    mistakes: [
      "Only using YouTube's automatic banner without verbal mention",
      "Disclosing too late in the video (after hook)",
      "Using vague language like 'Thanks to our partner'",
      "Forgetting disclosure in Shorts format",
    ],
  },
  youtube_shorts: {
    platform: "youtube_shorts",
    platformName: "YouTube Shorts",
    builtInTools: [
      "Video contains paid promotion checkbox",
    ],
    requiredDisclosure: "Verbal disclosure + on-screen text in first seconds",
    recommendations: [
      "Verbal disclosure in first 3 seconds (attention span is short)",
      "Add on-screen text 'AD' or 'Sponsored by [Brand]'",
      "Include #ad in title/description",
      "Don't rely on description alone - most viewers don't read it",
    ],
    mistakes: [
      "Assuming YouTube banner is enough for Shorts",
      "Putting disclosure only in description",
      "Making verbal disclosure too quick to hear",
    ],
  },
  twitter: {
    platform: "twitter",
    platformName: "X (Twitter)",
    builtInTools: [],
    requiredDisclosure: "#ad at the start of tweet",
    recommendations: [
      "Put #ad at the very beginning of your tweet",
      "For threads, disclose in the first tweet",
      "Use #sponsored for longer campaigns",
      "Don't use abbreviations like #sp",
    ],
    mistakes: [
      "Putting #ad at the end among other hashtags",
      "Only disclosing in a reply to your own tweet",
      "Using unclear hashtags (#partner, #collab without #ad)",
    ],
  },
  threads: {
    platform: "threads",
    platformName: "Threads",
    builtInTools: [],
    requiredDisclosure: "#ad at start of post",
    recommendations: [
      "Same rules as Instagram - start with #ad",
      "Be explicit since platform is newer",
      "Cross-posting from Instagram should maintain disclosure",
    ],
    mistakes: [
      "Assuming cross-posts include disclosure automatically",
      "Using informal language without clear #ad tag",
    ],
  },
  pinterest: {
    platform: "pinterest",
    platformName: "Pinterest",
    builtInTools: [
      "Paid partnership label in Pin creation",
    ],
    requiredDisclosure: "#ad in Pin description",
    recommendations: [
      "Use Pinterest's paid partnership label",
      "Include #ad or #sponsored in Pin description",
      "Add disclosure to any linked landing pages",
      "For Idea Pins, add disclosure to first frame",
    ],
    mistakes: [
      "Not disclosing affiliate links",
      "Only using board names without Pin-level disclosure",
    ],
  },
  linkedin: {
    platform: "linkedin",
    platformName: "LinkedIn",
    builtInTools: [],
    requiredDisclosure: "#ad or 'Sponsored' at beginning of post",
    recommendations: [
      "Start post with 'Sponsored:' or include #ad early",
      "Maintain professional tone while being clear about sponsorship",
      "For B2B content, be especially transparent about business relationships",
    ],
    mistakes: [
      "Being vague about professional relationships",
      "Assuming B2B audience doesn't need disclosure",
    ],
  },
  bluesky: {
    platform: "bluesky",
    platformName: "Bluesky",
    builtInTools: [],
    requiredDisclosure: "#ad at start of post",
    recommendations: [
      "Same rules as Twitter - lead with #ad",
      "Be clear since platform norms are still forming",
    ],
    mistakes: [
      "Assuming smaller platform means less scrutiny",
    ],
  },
  lemon8: {
    platform: "lemon8",
    platformName: "Lemon8",
    builtInTools: [],
    requiredDisclosure: "#ad in post caption",
    recommendations: [
      "Include #ad prominently in caption",
      "Disclose gifted products especially for product reviews",
      "For shopping-focused content, be extra clear about sponsorships",
    ],
    mistakes: [
      "Not disclosing affiliate links in shopping posts",
      "Being unclear about gifted products",
    ],
  },
  snapchat: {
    platform: "snapchat",
    platformName: "Snapchat",
    builtInTools: [],
    requiredDisclosure: "Verbal or text disclosure visible in Snap",
    recommendations: [
      "Add 'AD' or 'Sponsored' text overlay visible in Snap",
      "Verbal disclosure for video content",
      "For Stories, include disclosure in each relevant Snap",
      "Don't assume disappearing content is exempt",
    ],
    mistakes: [
      "Thinking temporary content doesn't need disclosure",
      "Making text disclosure too small or brief",
    ],
  },
  twitch: {
    platform: "twitch",
    platformName: "Twitch",
    builtInTools: [
      "Stream title disclosure",
      "!sponsor or !ad chat commands",
    ],
    requiredDisclosure: "Verbal disclosure + stream title tag",
    recommendations: [
      "Include 'Sponsored' or '#ad' in stream title",
      "Verbally disclose at the start of sponsored segments",
      "Set up !sponsor command in chat",
      "Disclose ongoing sponsorships periodically during stream",
      "VODs should maintain disclosure context",
    ],
    mistakes: [
      "Only disclosing once at stream start for multi-hour streams",
      "Not updating stream title for mid-stream sponsorships",
      "Forgetting that VODs and clips also need context",
    ],
  },
};

// =============================================================================
// CONTENT-SPECIFIC RULES
// =============================================================================

const CONTENT_RULES: Record<CompensationType, ContentDisclosureRule> = {
  paid: {
    type: "paid",
    requirement: "Clear disclosure that this is a paid partnership",
    acceptableFormats: [
      "#ad",
      "#sponsored",
      "#advertisement",
      "Paid partnership with [Brand]",
      "This content is sponsored by [Brand]",
      "Ad: [content]",
    ],
    unacceptableFormats: [
      "#sp",
      "#spon",
      "#collab (alone)",
      "#partner (alone)",
      "#ambassador (alone)",
      "Thanks to [Brand]",
      "Working with [Brand]",
    ],
  },
  gifted: {
    type: "gifted",
    requirement: "Disclose that the product was received for free",
    acceptableFormats: [
      "#gifted",
      "#pr",
      "#prpackage",
      "Gifted by [Brand]",
      "This product was sent to me by [Brand]",
      "[Brand] gifted me this product",
    ],
    unacceptableFormats: [
      "Just saying thanks (without disclosure)",
      "Only mentioning you 'love' the product",
      "Implying you purchased it yourself",
    ],
  },
  affiliate: {
    type: "affiliate",
    requirement: "Disclose the affiliate relationship and that you may earn commission",
    acceptableFormats: [
      "#affiliate",
      "#affiliatelink",
      "Affiliate link (I may earn commission)",
      "This post contains affiliate links",
      "I earn a small commission if you purchase through my link",
    ],
    unacceptableFormats: [
      "Just dropping a link without disclosure",
      "Link in bio (alone)",
      "Use my code (without affiliate disclosure)",
    ],
  },
  hybrid: {
    type: "hybrid",
    requirement: "Disclose both the paid partnership AND any commission/affiliate component",
    acceptableFormats: [
      "#ad + #affiliate",
      "Paid partnership with [Brand] - I also earn commission on sales",
      "Sponsored + affiliate link",
    ],
    unacceptableFormats: [
      "Only disclosing one element",
      "Burying affiliate disclosure",
    ],
  },
};

// =============================================================================
// GENERAL REMINDERS
// =============================================================================

const GENERAL_REMINDERS = [
  "Disclosure must be at the BEGINNING of your content - before any other text or hashtags",
  "Disclosure must be visible without clicking 'more' or 'see full post'",
  "Use clear, unambiguous language that regular viewers will understand",
  "#ad and #sponsored are the safest, most recognized disclosure formats",
  "When in doubt, over-disclose - the FTC prefers clear over creative",
  "Disclosure requirements apply regardless of how much you were paid",
  "You are responsible for your disclosures, not the brand",
  "Keep records of your brand partnerships and disclosures",
];

// =============================================================================
// FTC COMPLIANCE CHECKLIST ITEMS
// =============================================================================

const BASE_CHECKLIST: FTCChecklistItem[] = [
  {
    id: "visible-disclosure",
    text: "Disclosure is clearly visible without clicking 'more'",
    priority: "critical",
    reason: "Hidden disclosures are the most common FTC violation",
  },
  {
    id: "beginning-placement",
    text: "Disclosure is at the beginning of caption/content",
    priority: "critical",
    reason: "Viewers must see disclosure before engaging with promotional content",
  },
  {
    id: "clear-language",
    text: "Using #ad, #sponsored, or 'Paid partnership' (not #sp or #collab)",
    priority: "critical",
    reason: "Ambiguous hashtags don't meet FTC requirements",
  },
  {
    id: "platform-tools",
    text: "Using platform's built-in disclosure tools if available",
    priority: "important",
    reason: "Platform tools provide additional legal protection",
  },
  {
    id: "all-formats",
    text: "Disclosure included in all formats (feed, Stories, Reels, etc.)",
    priority: "important",
    reason: "Each piece of content needs its own disclosure",
  },
];

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Get compensation type from deal context.
 *
 * @param dealType - The deal type (sponsored, ugc)
 * @param hasGift - Whether gift/product is included
 * @param hasAffiliate - Whether there's an affiliate component
 */
export function getCompensationType(
  dealType: DealType = "sponsored",
  hasGift: boolean = false,
  hasAffiliate: boolean = false
): CompensationType {
  // If deal has both paid and affiliate, it's hybrid
  if (hasAffiliate && dealType === "sponsored") {
    return "hybrid";
  }

  // Pure affiliate
  if (hasAffiliate && dealType !== "sponsored") {
    return "affiliate";
  }

  // Gift only (no payment)
  if (hasGift && dealType !== "sponsored") {
    return "gifted";
  }

  // Default to paid for sponsored content
  return "paid";
}

/**
 * Get FTC disclosure guidance for a specific platform and deal type.
 *
 * @param platform - Target social media platform
 * @param compensationType - Type of compensation (paid, gifted, affiliate, hybrid)
 * @param hasAIContent - Whether AI tools will be used in content creation
 * @returns Complete FTC guidance with platform-specific rules and checklist
 */
export function getFTCGuidance(
  platform: Platform,
  compensationType: CompensationType = "paid",
  hasAIContent: boolean = false
): FTCGuidance {
  const platformGuidance = PLATFORM_GUIDANCE[platform];
  const contentRules = CONTENT_RULES[compensationType];

  // Build checklist based on compensation type
  const checklist: FTCChecklistItem[] = [...BASE_CHECKLIST];

  // Add platform-specific checklist items
  if (platformGuidance.builtInTools.length > 0) {
    checklist.push({
      id: "platform-label",
      text: `Use ${platformGuidance.platformName}'s built-in disclosure label`,
      priority: "important",
      reason: "Platform tools increase visibility and provide audit trail",
    });
  }

  // Add video-specific items for video platforms
  if (["tiktok", "youtube", "youtube_shorts", "twitch"].includes(platform)) {
    checklist.push({
      id: "verbal-disclosure",
      text: "Include verbal disclosure in first 30 seconds of video",
      priority: "critical",
      reason: "Many viewers watch without reading captions",
    });
  }

  // Add affiliate-specific items
  if (compensationType === "affiliate" || compensationType === "hybrid") {
    checklist.push({
      id: "affiliate-disclosure",
      text: "Clearly state you earn commission from purchases",
      priority: "critical",
      reason: "Affiliate relationships require explicit disclosure",
    });
  }

  // Add gift-specific items
  if (compensationType === "gifted") {
    checklist.push({
      id: "gift-disclosure",
      text: "Disclose that product was received for free",
      priority: "critical",
      reason: "Free products are 'material connection' under FTC rules",
    });
  }

  // AI content disclosure (new 2025)
  let aiDisclosure: AIDisclosureGuidance | null = null;
  if (hasAIContent) {
    aiDisclosure = {
      recommended: true,
      explanation:
        "When AI tools are used to substantially create or alter content (images, videos, voice), " +
        "disclosure may be required. This is an evolving area - when in doubt, disclose.",
      suggestedText: "Created with AI assistance",
    };

    checklist.push({
      id: "ai-disclosure",
      text: "Disclose use of AI tools in content creation",
      priority: "recommended",
      reason: "Transparency about AI-generated or AI-assisted content builds trust",
    });
  }

  // Build summary
  const summary = buildSummary(platformGuidance, compensationType);

  return {
    platformGuidance,
    contentRules,
    aiDisclosure,
    summary,
    checklist,
    generalReminders: GENERAL_REMINDERS,
  };
}

/**
 * Build a quick-reference summary for the guidance.
 */
function buildSummary(
  platformGuidance: PlatformDisclosureGuidance,
  compensationType: CompensationType
): FTCGuidance["summary"] {
  const headlines: Record<CompensationType, string> = {
    paid: "This is a paid partnership - FTC disclosure required",
    gifted: "This is a gifted product - FTC disclosure required",
    affiliate: "This contains affiliate links - FTC disclosure required",
    hybrid: "This is a paid partnership with affiliate links - FTC disclosure required",
  };

  const requiredTexts: Record<CompensationType, string> = {
    paid: "#ad or 'Paid partnership with [Brand]'",
    gifted: "#gifted or 'This product was gifted by [Brand]'",
    affiliate: "#affiliate or 'I may earn commission from links'",
    hybrid: "#ad + disclosure that you earn commission from sales",
  };

  return {
    headline: headlines[compensationType],
    requiredText: requiredTexts[compensationType],
    placement: `${platformGuidance.requiredDisclosure} - at the BEGINNING, visible without clicking 'more'`,
  };
}

/**
 * Get all platform guidance for reference.
 */
export function getAllPlatformGuidance(): PlatformDisclosureGuidance[] {
  return Object.values(PLATFORM_GUIDANCE);
}

/**
 * Get content rules for a specific compensation type.
 */
export function getContentRules(compensationType: CompensationType): ContentDisclosureRule {
  return CONTENT_RULES[compensationType];
}

/**
 * Validate if a disclosure text meets FTC requirements.
 * This is a simple heuristic check, not legal advice.
 *
 * @param disclosureText - The disclosure text to validate
 * @param compensationType - Type of compensation
 * @returns Validation result with pass/fail and explanation
 */
export function validateDisclosure(
  disclosureText: string,
  compensationType: CompensationType
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const text = disclosureText.toLowerCase();

  // For hybrid, handle specially since it requires both components
  if (compensationType === "hybrid") {
    const hasPaidDisclosure = text.includes("#ad") || text.includes("sponsored") || text.includes("paid");
    const hasAffiliateDisclosure = text.includes("affiliate") || text.includes("commission") || text.includes("earn");

    if (!hasPaidDisclosure) {
      issues.push("Missing paid partnership disclosure");
    }
    if (!hasAffiliateDisclosure) {
      issues.push("Missing affiliate/commission disclosure");
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // Check for acceptable formats
  const contentRule = CONTENT_RULES[compensationType];
  const hasAcceptable = contentRule.acceptableFormats.some(
    (format) => text.includes(format.toLowerCase().replace("[brand]", ""))
  );

  if (!hasAcceptable) {
    issues.push(
      `Missing required disclosure format. Use one of: ${contentRule.acceptableFormats.slice(0, 3).join(", ")}`
    );
  }

  // Check for unacceptable formats being used alone
  const unacceptableAlone = ["#sp", "#spon", "#collab"];
  for (const bad of unacceptableAlone) {
    if (text.includes(bad) && !text.includes("#ad") && !text.includes("#sponsored")) {
      issues.push(`${bad} alone is not sufficient - must also include #ad or #sponsored`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
