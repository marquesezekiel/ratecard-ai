/**
 * DM Text Parser with Gift Detection
 *
 * Parses brand DMs to extract opportunity details, detect gift offers,
 * and provide recommended responses. Uses Groq (llama-3.3-70b-versatile)
 * as primary provider with Google Gemini as fallback.
 */

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  DMAnalysis,
  DMCompensationType,
  DMTone,
  DMUrgency,
  GiftAnalysis,
  GiftContentExpectation,
  GiftConversionPotential,
  GiftRecommendedApproach,
  CreatorProfile,
  CreatorTier,
  ParsedBrief,
  Platform,
  ContentFormat,
} from "./types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MIN_DM_LENGTH = 20;

// Base rates by tier for suggested rate calculation
const BASE_RATES: Record<CreatorTier, number> = {
  nano: 150,
  micro: 400,
  mid: 800,
  rising: 1500,
  macro: 3000,
  mega: 6000,
  celebrity: 12000,
};

// Gift trigger phrases for detection
const GIFT_TRIGGER_PHRASES = [
  "send you product",
  "send you our",
  "gift",
  "gifted",
  "gifting",
  "try our",
  "in exchange for",
  "free product",
  "complimentary",
  "no monetary",
  "product seeding",
  "pr package",
  "pr gift",
  "sample",
  "we'd love to send",
  "love to send you",
];

// Mass outreach signals
const MASS_OUTREACH_SIGNALS = [
  "hey babe",
  "hey girl",
  "hey hun",
  "hey beauty",
  "hey gorgeous",
  "hi there!",
  "hope this finds you well",
  "we love your feed",
  "we love your content",
  "we've been following",
];

// =============================================================================
// LLM CLIENTS
// =============================================================================

let groqClient: Groq | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const DM_PARSER_SYSTEM_PROMPT = `You are an expert at analyzing brand outreach DMs to content creators. Extract structured information and assess the opportunity quality.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "brandName": "string or null",
  "brandHandle": "string or null",
  "deliverableRequest": "string or null",
  "compensationType": "paid" | "gifted" | "hybrid" | "unclear" | "none_mentioned",
  "offeredAmount": number or null,
  "estimatedProductValue": number or null,
  "tone": "professional" | "casual" | "mass_outreach" | "scam_likely",
  "urgency": "high" | "medium" | "low",
  "redFlags": ["array of strings"],
  "greenFlags": ["array of strings"],
  "isGiftOffer": boolean,
  "giftAnalysis": {
    "productMentioned": "string or null",
    "contentExpectation": "explicit" | "implied" | "none",
    "conversionPotential": "high" | "medium" | "low",
    "recommendedApproach": "accept_and_convert" | "counter_with_hybrid" | "decline" | "ask_budget"
  } or null,
  "extractedPlatform": "instagram" | "tiktok" | "youtube" | "twitter" | "threads" | "linkedin" | null,
  "extractedFormat": "static" | "carousel" | "story" | "reel" | "video" | "live" | null,
  "extractedQuantity": number or null
}

Analysis guidelines:

COMPENSATION TYPE DETECTION:
- "paid": Explicit mention of payment, budget, rate, fee, compensation
- "gifted": Mentions sending product, PR package, gift, "in exchange for", "try our product"
- "hybrid": Both product AND payment mentioned
- "unclear": Vague about compensation
- "none_mentioned": No compensation discussed

GIFT OFFER DETECTION (isGiftOffer = true when):
- Mentions sending free product
- Uses phrases like "gift", "PR package", "product seeding"
- Offers product "in exchange for" content
- No monetary compensation mentioned but expects content

GIFT CONTENT EXPECTATION:
- "explicit": Clearly states expected content (post, reel, review)
- "implied": Suggests sharing with audience but not specific
- "none": Just offering product with no content expectation

GIFT CONVERSION POTENTIAL:
- "high": Major brand, professional approach, mentions future paid work
- "medium": Legitimate brand, decent approach
- "low": Unknown brand, mass outreach, no relationship building

GIFT RECOMMENDED APPROACH:
- "accept_and_convert": High-value product from good brand, good for portfolio
- "counter_with_hybrid": Ask for reduced rate + product
- "decline": Low value or red flags
- "ask_budget": Professional approach but unclear on budget

TONE DETECTION:
- "professional": Formal, specific, mentions budget or clear expectations
- "casual": Friendly but legitimate, some details provided
- "mass_outreach": Generic, overly familiar, template-like ("Hey babe!", excessive emojis)
- "scam_likely": Too good to be true, pressure tactics, suspicious requests

RED FLAGS (include if present):
- Mass outreach signals (generic greeting, "Hey babe!")
- No budget mentioned when deliverables expected
- Unrealistic compensation claims
- Pressure tactics or artificial urgency
- Vague brand identity
- Request for personal information
- Poor grammar/spelling (potential scam)
- Asking for free work with "exposure"

GREEN FLAGS (include if present):
- Specific budget mentioned
- Clear deliverable expectations
- Professional tone
- Brand has verifiable presence
- Reasonable timeline
- Previous creator partnerships mentioned
- Respects creator's work

URGENCY:
- "high": Explicit deadline, "ASAP", "urgent"
- "medium": General timeline mentioned
- "low": No rush, open-ended`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Check if the DM text contains gift-related phrases.
 */
export function containsGiftIndicators(text: string): boolean {
  const lowerText = text.toLowerCase();
  return GIFT_TRIGGER_PHRASES.some((phrase) => lowerText.includes(phrase));
}

/**
 * Check if the DM text shows mass outreach patterns.
 */
export function containsMassOutreachSignals(text: string): boolean {
  const lowerText = text.toLowerCase();
  return MASS_OUTREACH_SIGNALS.some((signal) => lowerText.includes(signal));
}

/**
 * Calculate suggested rate based on creator tier.
 */
function getSuggestedRate(profile: CreatorProfile): number {
  return BASE_RATES[profile.tier] || BASE_RATES.micro;
}

/**
 * Calculate suggested rate for gift offers (counter with hybrid).
 */
function getHybridSuggestedRate(profile: CreatorProfile): number {
  // For hybrid deals, suggest 50% of normal rate + product
  return Math.round(getSuggestedRate(profile) * 0.5);
}

/**
 * Generate recommended response based on analysis.
 */
function generateRecommendedResponse(
  analysis: Partial<DMAnalysis>,
  profile: CreatorProfile
): string {
  const brandName = analysis.brandName || "there";
  const suggestedRate = getSuggestedRate(profile);

  // Gift offer responses
  if (analysis.isGiftOffer && analysis.giftAnalysis) {
    switch (analysis.giftAnalysis.recommendedApproach) {
      case "accept_and_convert":
        return `Hi ${brandName}! Thanks for reaching out - I'd love to try your product!

I'm happy to share my honest experience with my audience. If the content performs well, I'd love to discuss a paid partnership for future campaigns!

Where should I send my shipping info?`;

      case "counter_with_hybrid":
        const hybridRate = getHybridSuggestedRate(profile);
        return `Hi ${brandName}! Thank you for thinking of me - the product looks amazing!

For a dedicated post, my rate is typically $${suggestedRate}. I'd be happy to do a hybrid collaboration:

→ Product gifted + $${hybridRate} = dedicated content with my authentic review

This lets me create the high-quality content your brand deserves. Would that work with your budget?`;

      case "ask_budget":
        return `Hi ${brandName}! Thanks for reaching out!

Before I confirm, I have a few quick questions:
1. What's the retail value of the product?
2. What deliverables are you hoping for?
3. Is there a budget for this partnership, or is it product-only?

Looking forward to hearing more!`;

      case "decline":
        return `Thanks so much for thinking of me!

I'm currently focused on paid partnerships, but I appreciate you reaching out. If you have budget for a collaboration in the future, I'd love to chat!

Best of luck with your campaign!`;
    }
  }

  // Paid offer responses
  if (analysis.compensationType === "paid" && analysis.offeredAmount) {
    if (analysis.offeredAmount >= suggestedRate * 0.8) {
      return `Hi ${brandName}! Thank you for the opportunity - I'd love to work together!

The rate works for me. Could you share more details about:
- Timeline and deadlines
- Usage rights and duration
- Content approval process

Looking forward to collaborating!`;
    } else {
      return `Hi ${brandName}! Thanks for reaching out - I love the concept!

Based on my audience reach and engagement, my rate for this type of content is $${suggestedRate}. This includes:
- High-quality content creation
- 30-day usage rights
- One round of revisions

Would this work with your budget? Happy to discuss further!`;
    }
  }

  // Vague/unclear responses
  if (analysis.compensationType === "unclear" || analysis.compensationType === "none_mentioned") {
    return `Hi ${brandName}! Thanks for reaching out!

I'd love to learn more about this opportunity. Could you share:
- What deliverables you're looking for?
- What's the budget for this campaign?
- Timeline and usage rights?

Looking forward to hearing more details!`;
  }

  // Default response
  return `Hi ${brandName}! Thanks for reaching out - I'm interested in learning more.

My rate for branded content is $${suggestedRate}. Could you share more details about the campaign?

Looking forward to hearing from you!`;
}

/**
 * Generate next steps based on analysis.
 */
function generateNextSteps(analysis: Partial<DMAnalysis>): string[] {
  const steps: string[] = [];

  if (analysis.isGiftOffer) {
    steps.push("Consider if the product aligns with your brand");
    steps.push("Evaluate the gift using the Gift Evaluator");

    if (analysis.giftAnalysis?.recommendedApproach === "counter_with_hybrid") {
      steps.push("Send hybrid counter-offer");
      steps.push("Track brand in Gift Tracker for follow-up");
    } else if (analysis.giftAnalysis?.recommendedApproach === "accept_and_convert") {
      steps.push("Accept and track for conversion opportunity");
      steps.push("Set reminder to follow up after content performs well");
    }
  } else if (analysis.compensationType === "paid") {
    steps.push("Review the offered rate against your rate card");
    steps.push("Clarify usage rights and exclusivity");
    steps.push("Request contract before starting work");
  } else {
    steps.push("Ask clarifying questions about budget");
    steps.push("Research the brand's legitimacy");
    steps.push("Don't commit until compensation is clear");
  }

  if (analysis.redFlags && analysis.redFlags.length > 0) {
    steps.push("Address red flags before proceeding");
  }

  return steps;
}

/**
 * Estimate deal quality score (0-100).
 */
function estimateDealQuality(
  analysis: Partial<DMAnalysis>,
  profile: CreatorProfile
): number {
  let score = 50; // Start at neutral

  // Compensation type scoring
  if (analysis.compensationType === "paid") {
    score += 20;
    if (analysis.offeredAmount) {
      const suggestedRate = getSuggestedRate(profile);
      const ratioToMarket = analysis.offeredAmount / suggestedRate;
      if (ratioToMarket >= 1) score += 15;
      else if (ratioToMarket >= 0.8) score += 10;
      else if (ratioToMarket >= 0.5) score += 5;
      else score -= 5;
    }
  } else if (analysis.compensationType === "hybrid") {
    score += 10;
  } else if (analysis.compensationType === "gifted") {
    score -= 10;
    // Gift-specific adjustments
    if (analysis.giftAnalysis?.conversionPotential === "high") score += 15;
    else if (analysis.giftAnalysis?.conversionPotential === "medium") score += 5;
  } else if (analysis.compensationType === "unclear") {
    score -= 5;
  }

  // Tone scoring
  if (analysis.tone === "professional") score += 15;
  else if (analysis.tone === "casual") score += 5;
  else if (analysis.tone === "mass_outreach") score -= 10;
  else if (analysis.tone === "scam_likely") score -= 30;

  // Flag scoring
  if (analysis.greenFlags) {
    score += Math.min(analysis.greenFlags.length * 5, 15);
  }
  if (analysis.redFlags) {
    score -= Math.min(analysis.redFlags.length * 7, 25);
  }

  // Clamp score to 0-100
  return Math.max(0, Math.min(100, score));
}

// =============================================================================
// VALIDATION AND NORMALIZATION
// =============================================================================

/**
 * Validate and normalize LLM output to DMAnalysis structure.
 */
function validateAndNormalize(
  data: unknown,
  profile: CreatorProfile
): Omit<DMAnalysis, "recommendedResponse" | "suggestedRate" | "dealQualityEstimate" | "nextSteps"> {
  const parsed = data as Record<string, unknown>;

  // Validate compensation type
  const validCompensationTypes: DMCompensationType[] = [
    "paid",
    "gifted",
    "hybrid",
    "unclear",
    "none_mentioned",
  ];
  const compensationType = (parsed.compensationType as string) || "unclear";
  const normalizedCompensationType: DMCompensationType = validCompensationTypes.includes(
    compensationType as DMCompensationType
  )
    ? (compensationType as DMCompensationType)
    : "unclear";

  // Validate tone
  const validTones: DMTone[] = ["professional", "casual", "mass_outreach", "scam_likely"];
  const tone = (parsed.tone as string) || "casual";
  const normalizedTone: DMTone = validTones.includes(tone as DMTone)
    ? (tone as DMTone)
    : "casual";

  // Validate urgency
  const validUrgencies: DMUrgency[] = ["high", "medium", "low"];
  const urgency = (parsed.urgency as string) || "low";
  const normalizedUrgency: DMUrgency = validUrgencies.includes(urgency as DMUrgency)
    ? (urgency as DMUrgency)
    : "low";

  // Validate gift analysis
  let giftAnalysis: GiftAnalysis | null = null;
  const isGiftOffer = Boolean(parsed.isGiftOffer);

  if (isGiftOffer && parsed.giftAnalysis) {
    const ga = parsed.giftAnalysis as Record<string, unknown>;

    const validContentExpectations: GiftContentExpectation[] = ["explicit", "implied", "none"];
    const contentExpectation = (ga.contentExpectation as string) || "implied";
    const normalizedContentExpectation: GiftContentExpectation = validContentExpectations.includes(
      contentExpectation as GiftContentExpectation
    )
      ? (contentExpectation as GiftContentExpectation)
      : "implied";

    const validConversionPotentials: GiftConversionPotential[] = ["high", "medium", "low"];
    const conversionPotential = (ga.conversionPotential as string) || "medium";
    const normalizedConversionPotential: GiftConversionPotential =
      validConversionPotentials.includes(conversionPotential as GiftConversionPotential)
        ? (conversionPotential as GiftConversionPotential)
        : "medium";

    const validApproaches: GiftRecommendedApproach[] = [
      "accept_and_convert",
      "counter_with_hybrid",
      "decline",
      "ask_budget",
    ];
    const recommendedApproach = (ga.recommendedApproach as string) || "ask_budget";
    const normalizedApproach: GiftRecommendedApproach = validApproaches.includes(
      recommendedApproach as GiftRecommendedApproach
    )
      ? (recommendedApproach as GiftRecommendedApproach)
      : "ask_budget";

    giftAnalysis = {
      productMentioned: ga.productMentioned ? String(ga.productMentioned) : null,
      contentExpectation: normalizedContentExpectation,
      conversionPotential: normalizedConversionPotential,
      recommendedApproach: normalizedApproach,
    };
  }

  // Build extracted requirements
  const validPlatforms: Platform[] = [
    "instagram",
    "tiktok",
    "youtube",
    "twitter",
    "threads",
    "linkedin",
  ];
  const extractedPlatform = (parsed.extractedPlatform as string) || null;
  const normalizedPlatform: Platform | undefined =
    extractedPlatform && validPlatforms.includes(extractedPlatform as Platform)
      ? (extractedPlatform as Platform)
      : undefined;

  const validFormats: ContentFormat[] = [
    "static",
    "carousel",
    "story",
    "reel",
    "video",
    "live",
    "ugc",
  ];
  const extractedFormat = (parsed.extractedFormat as string) || null;
  const normalizedFormat: ContentFormat | undefined =
    extractedFormat && validFormats.includes(extractedFormat as ContentFormat)
      ? (extractedFormat as ContentFormat)
      : undefined;

  const extractedRequirements: Partial<ParsedBrief> = {};
  if (parsed.brandName) {
    extractedRequirements.brand = {
      name: String(parsed.brandName),
      industry: "",
      product: giftAnalysis?.productMentioned || "",
    };
  }
  if (normalizedPlatform || normalizedFormat || parsed.extractedQuantity) {
    extractedRequirements.content = {
      platform: normalizedPlatform || "instagram",
      format: normalizedFormat || "static",
      quantity: Math.max(1, Number(parsed.extractedQuantity) || 1),
      creativeDirection: "",
    };
  }

  return {
    brandName: parsed.brandName ? String(parsed.brandName) : null,
    brandHandle: parsed.brandHandle ? String(parsed.brandHandle) : null,
    deliverableRequest: parsed.deliverableRequest ? String(parsed.deliverableRequest) : null,
    compensationType: normalizedCompensationType,
    offeredAmount: parsed.offeredAmount ? Number(parsed.offeredAmount) : null,
    estimatedProductValue: parsed.estimatedProductValue
      ? Number(parsed.estimatedProductValue)
      : null,
    tone: normalizedTone,
    urgency: normalizedUrgency,
    redFlags: Array.isArray(parsed.redFlags)
      ? (parsed.redFlags as string[]).map(String)
      : [],
    greenFlags: Array.isArray(parsed.greenFlags)
      ? (parsed.greenFlags as string[]).map(String)
      : [],
    isGiftOffer,
    giftAnalysis,
    extractedRequirements,
  };
}

// =============================================================================
// LLM PARSING FUNCTIONS
// =============================================================================

/**
 * Parse DM using Groq API.
 */
async function parseWithGroq(
  dmText: string
): Promise<Record<string, unknown>> {
  const client = getGroqClient();

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: DM_PARSER_SYSTEM_PROMPT },
      { role: "user", content: `Analyze this brand DM:\n\n${dmText}` },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq");
  }

  return JSON.parse(content);
}

/**
 * Parse DM using Gemini API.
 */
async function parseWithGemini(
  dmText: string
): Promise<Record<string, unknown>> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const prompt = `${DM_PARSER_SYSTEM_PROMPT}\n\nAnalyze this brand DM:\n\n${dmText}`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();

  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(content);
}

/**
 * Attempt to parse a DM with retry logic.
 */
async function parseWithRetry(
  dmText: string,
  parser: (text: string) => Promise<Record<string, unknown>>,
  providerName: string
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await parser(dmText);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `${providerName} attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES - 1) {
        const delay = getBackoffDelay(attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error(`${providerName} parsing failed after ${MAX_RETRIES} attempts`);
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Parse a brand DM text and return structured analysis with gift detection.
 *
 * Uses Groq as primary provider, falls back to Gemini on error.
 * Detects gift offers, analyzes tone/quality, and generates recommended responses.
 *
 * @param dmText - The raw DM text to parse
 * @param creatorProfile - The creator's profile for rate calculations
 * @returns Complete DM analysis with recommendations
 * @throws Error if both providers fail or input is invalid
 */
export async function parseDMText(
  dmText: string,
  creatorProfile: CreatorProfile
): Promise<DMAnalysis> {
  // Validate input
  if (!dmText || dmText.trim().length < MIN_DM_LENGTH) {
    throw new Error(
      `DM text must be at least ${MIN_DM_LENGTH} characters long`
    );
  }

  const trimmedText = dmText.trim();

  // Try Groq first
  let llmResult: Record<string, unknown>;
  try {
    llmResult = await parseWithRetry(trimmedText, parseWithGroq, "Groq");
  } catch (groqError) {
    console.warn("Groq failed, falling back to Gemini:", groqError);

    // Fall back to Gemini
    try {
      llmResult = await parseWithRetry(trimmedText, parseWithGemini, "Gemini");
    } catch (geminiError) {
      console.error("Both Groq and Gemini failed:", geminiError);
      throw new Error(
        "Failed to parse DM with all available providers. Please try again later."
      );
    }
  }

  // Validate and normalize the LLM output
  const baseAnalysis = validateAndNormalize(llmResult, creatorProfile);

  // Generate additional fields
  const suggestedRate = baseAnalysis.isGiftOffer
    ? getHybridSuggestedRate(creatorProfile)
    : getSuggestedRate(creatorProfile);

  const dealQualityEstimate = estimateDealQuality(baseAnalysis, creatorProfile);
  const recommendedResponse = generateRecommendedResponse(baseAnalysis, creatorProfile);
  const nextSteps = generateNextSteps(baseAnalysis);

  return {
    ...baseAnalysis,
    suggestedRate,
    dealQualityEstimate,
    recommendedResponse,
    nextSteps,
  };
}

/**
 * Quick check if a DM appears to be a gift offer.
 * Can be used for fast pre-filtering without full LLM analysis.
 *
 * @param dmText - The DM text to check
 * @returns True if the text contains gift-related indicators
 */
export function isLikelyGiftOffer(dmText: string): boolean {
  return containsGiftIndicators(dmText);
}

/**
 * Quick check if a DM appears to be mass outreach.
 * Can be used for fast pre-filtering without full LLM analysis.
 *
 * @param dmText - The DM text to check
 * @returns True if the text contains mass outreach signals
 */
export function isLikelyMassOutreach(dmText: string): boolean {
  return containsMassOutreachSignals(dmText);
}
