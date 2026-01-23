/**
 * Brand Vetter - Research brand legitimacy and detect scams
 *
 * Performs 4 checks to calculate a trust score (0-100):
 * 1. Social Presence (25 pts) - follower count, activity, engagement
 * 2. Website Verification (25 pts) - SSL, domain quality, contact info
 * 3. Collaboration History (25 pts) - past creator partnerships
 * 4. Scam Indicators (25 pts inverse) - red flags detected
 *
 * Uses Groq (llama-3.3-70b-versatile) as primary provider with Google Gemini as fallback.
 */

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Platform } from "./types";

// =============================================================================
// TYPES
// =============================================================================

export interface BrandVettingInput {
  /** Brand/company name (required) */
  brandName: string;
  /** Brand's social handle e.g., @glowskinco (optional) */
  brandHandle?: string;
  /** Brand's website URL e.g., https://glowskin.co (optional) */
  brandWebsite?: string;
  /** Brand's email address (optional) */
  brandEmail?: string;
  /** Platform where brand reached out */
  platform: Platform;
}

export interface BrandVettingResult {
  /** Overall trust score (0-100) */
  trustScore: number;
  /** Trust level category */
  trustLevel: TrustLevel;

  /** Breakdown by category (each 0-25 points) */
  breakdown: {
    socialPresence: CategoryScore;
    websiteVerification: CategoryScore;
    collaborationHistory: CategoryScore;
    scamIndicators: CategoryScore;
  };

  /** Positive and neutral findings */
  findings: BrandFinding[];
  /** Red flags detected */
  redFlags: BrandRedFlag[];
  /** Actionable recommendations */
  recommendations: string[];

  /** When this vetting was performed */
  checkedAt: Date;
  /** Sources used for research */
  dataSources: string[];
  /** Whether result was from cache */
  cached: boolean;
}

export type TrustLevel = "verified" | "likely_legit" | "caution" | "high_risk";

export interface CategoryScore {
  /** Score for this category (0-25) */
  score: number;
  /** Confidence in the assessment */
  confidence: "high" | "medium" | "low";
  /** Key details for this category */
  details: string[];
}

export interface BrandFinding {
  /** Category this finding relates to */
  category: "social" | "website" | "collabs" | "scam_check";
  /** The finding description */
  finding: string;
  /** Supporting evidence or data */
  evidence?: string;
  /** Whether this is positive, neutral, or negative */
  sentiment: "positive" | "neutral" | "negative";
}

export interface BrandRedFlag {
  /** Severity of the red flag */
  severity: "high" | "medium" | "low";
  /** What the red flag is */
  flag: string;
  /** Why this is concerning */
  explanation: string;
  /** Where this was detected */
  source?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const WEBSITE_TIMEOUT_MS = 5000;

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

const BRAND_VETTER_SYSTEM_PROMPT = `You are an expert at researching brand legitimacy for content creators. Your job is to assess whether a brand is trustworthy for partnership opportunities.

Analyze the provided brand information and return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "socialPresence": {
    "score": number (0-25),
    "confidence": "high" | "medium" | "low",
    "details": ["string array of findings"],
    "estimatedFollowers": number | null,
    "estimatedAge": "string describing account age" | null,
    "isVerified": boolean | null,
    "postingFrequency": "active" | "moderate" | "inactive" | "unknown"
  },
  "websiteVerification": {
    "score": number (0-25),
    "confidence": "high" | "medium" | "low",
    "details": ["string array of findings"],
    "domainQuality": "premium" | "standard" | "free_hosting" | "suspicious" | "unknown",
    "hasContactPage": boolean | null,
    "hasAboutPage": boolean | null,
    "professionalDesign": boolean | null
  },
  "collaborationHistory": {
    "score": number (0-25),
    "confidence": "high" | "medium" | "low",
    "details": ["string array of findings"],
    "knownCollabs": number | null,
    "hasAmbassadorProgram": boolean | null,
    "creatorTestimonials": boolean | null
  },
  "scamIndicators": {
    "score": number (0-25, start at 25 and subtract for each red flag),
    "confidence": "high" | "medium" | "low",
    "details": ["string array of findings"],
    "redFlagsFound": [
      {
        "flag": "string",
        "severity": "high" | "medium" | "low",
        "explanation": "string"
      }
    ]
  },
  "findings": [
    {
      "category": "social" | "website" | "collabs" | "scam_check",
      "finding": "string",
      "evidence": "string or null",
      "sentiment": "positive" | "neutral" | "negative"
    }
  ],
  "recommendations": ["string array of actionable advice"],
  "dataSources": ["string array of sources used"]
}

SCORING GUIDELINES:

1. SOCIAL PRESENCE (25 points):
   - Substantial follower count for their niche: +5-10 points
   - Account age > 2 years: +5 points
   - Account age 1-2 years: +3 points
   - Account age < 1 year: +1 point
   - Active posting (weekly): +5 points
   - Real engagement (not bought followers): +5 points
   - Verified badge: +5 bonus (can exceed 25)
   - No social presence found: 5-10 points max

2. WEBSITE VERIFICATION (25 points):
   - Real domain (not free hosting): +8 points
   - SSL/HTTPS: +5 points
   - Contact page with real info: +5 points
   - About page with company details: +4 points
   - Professional design: +3 points
   - No website: 8-12 points (not disqualifying but less trust)
   - Free hosting (wix.free, blogspot): +3 points max

3. COLLABORATION HISTORY (25 points):
   - Evidence of past creator collaborations: +10 points
   - Ambassador/partner program: +5 points
   - Creator testimonials: +5 points
   - Brand reposts creator content: +3 points
   - No evidence found: 5-10 points (neutral)
   - Major brand with known campaigns: +15-20 points

4. SCAM INDICATORS (25 points - INVERSE):
   Start at 25, subtract for each red flag:
   - Dropshipping signals (aliexpress products, etc.): -5
   - MLM/pyramid scheme indicators: -10
   - "Pay to collab" language: -15
   - Fake follower patterns: -5
   - Too-good-to-be-true offers: -5
   - Pressure tactics/urgency: -3
   - No payment mentioned but expecting content: -5
   - Brand new account mass outreaching: -3
   - Suspicious domain or email: -5

RED FLAG SEVERITY:
- high: Major concern, likely scam (MLM, pay-to-collab)
- medium: Caution advised (new brand, unclear terms)
- low: Minor concern, worth noting (no website, inactive)

Be conservative with scores when information is limited. It's better to show "caution" than to falsely verify a brand. Base your analysis on the brand information provided and general knowledge about the brand if it's well-known.`;

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
 * Check if a website exists and is reachable.
 */
async function checkWebsiteExists(url: string): Promise<{
  exists: boolean;
  isHttps: boolean;
  error?: string;
}> {
  try {
    // Ensure URL has protocol
    let normalizedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      normalizedUrl = `https://${url}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBSITE_TIMEOUT_MS);

    const response = await fetch(normalizedUrl, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    return {
      exists: response.ok || response.status < 500,
      isHttps: normalizedUrl.startsWith("https://"),
    };
  } catch (error) {
    // Try HTTP if HTTPS failed
    if (url.startsWith("https://")) {
      try {
        const httpUrl = url.replace("https://", "http://");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEBSITE_TIMEOUT_MS);

        const response = await fetch(httpUrl, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
        });

        clearTimeout(timeoutId);

        return {
          exists: response.ok || response.status < 500,
          isHttps: false,
        };
      } catch {
        // Both failed
      }
    }

    return {
      exists: false,
      isHttps: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Determine trust level from score.
 */
export function getTrustLevel(score: number): TrustLevel {
  if (score >= 80) return "verified";
  if (score >= 60) return "likely_legit";
  if (score >= 40) return "caution";
  return "high_risk";
}

/**
 * Get trust level display info.
 */
export function getTrustLevelInfo(level: TrustLevel): {
  label: string;
  color: string;
  description: string;
} {
  switch (level) {
    case "verified":
      return {
        label: "Verified",
        color: "green",
        description: "Safe to proceed - this brand checks out",
      };
    case "likely_legit":
      return {
        label: "Likely Legit",
        color: "blue",
        description: "Probably fine - do basic due diligence",
      };
    case "caution":
      return {
        label: "Proceed with Caution",
        color: "yellow",
        description: "Proceed carefully - ask questions before committing",
      };
    case "high_risk":
      return {
        label: "High Risk",
        color: "red",
        description: "Likely scam - consider avoiding",
      };
  }
}

// =============================================================================
// LLM PARSING FUNCTIONS
// =============================================================================

interface LLMVettingResponse {
  socialPresence: {
    score: number;
    confidence: "high" | "medium" | "low";
    details: string[];
    estimatedFollowers?: number | null;
    estimatedAge?: string | null;
    isVerified?: boolean | null;
    postingFrequency?: "active" | "moderate" | "inactive" | "unknown";
  };
  websiteVerification: {
    score: number;
    confidence: "high" | "medium" | "low";
    details: string[];
    domainQuality?: "premium" | "standard" | "free_hosting" | "suspicious" | "unknown";
    hasContactPage?: boolean | null;
    hasAboutPage?: boolean | null;
    professionalDesign?: boolean | null;
  };
  collaborationHistory: {
    score: number;
    confidence: "high" | "medium" | "low";
    details: string[];
    knownCollabs?: number | null;
    hasAmbassadorProgram?: boolean | null;
    creatorTestimonials?: boolean | null;
  };
  scamIndicators: {
    score: number;
    confidence: "high" | "medium" | "low";
    details: string[];
    redFlagsFound: Array<{
      flag: string;
      severity: "high" | "medium" | "low";
      explanation: string;
    }>;
  };
  findings: Array<{
    category: "social" | "website" | "collabs" | "scam_check";
    finding: string;
    evidence?: string | null;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  recommendations: string[];
  dataSources: string[];
}

/**
 * Build the prompt for brand vetting.
 */
function buildVettingPrompt(input: BrandVettingInput, websiteCheck?: { exists: boolean; isHttps: boolean }): string {
  const parts: string[] = [
    `Research this brand for a content creator partnership opportunity:`,
    ``,
    `Brand Name: ${input.brandName}`,
  ];

  if (input.brandHandle) {
    parts.push(`Social Handle: ${input.brandHandle}`);
  }

  if (input.brandWebsite) {
    parts.push(`Website: ${input.brandWebsite}`);
    if (websiteCheck) {
      parts.push(`Website Status: ${websiteCheck.exists ? "Reachable" : "Not reachable"}, ${websiteCheck.isHttps ? "HTTPS" : "HTTP only"}`);
    }
  }

  if (input.brandEmail) {
    parts.push(`Contact Email: ${input.brandEmail}`);
  }

  parts.push(`Platform: ${input.platform}`);
  parts.push(``);
  parts.push(`Assess this brand's legitimacy based on the information provided and your general knowledge.`);
  parts.push(`If the brand is well-known, use that information. If unknown, be conservative with scores.`);

  return parts.join("\n");
}

/**
 * Parse with Groq API.
 */
async function parseWithGroq(prompt: string): Promise<LLMVettingResponse> {
  const client = getGroqClient();

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: BRAND_VETTER_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq");
  }

  return JSON.parse(content) as LLMVettingResponse;
}

/**
 * Parse with Gemini API.
 */
async function parseWithGemini(prompt: string): Promise<LLMVettingResponse> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const fullPrompt = `${BRAND_VETTER_SYSTEM_PROMPT}\n\n${prompt}`;
  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  const content = response.text();

  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(content) as LLMVettingResponse;
}

/**
 * Attempt to parse with retry logic.
 */
async function parseWithRetry(
  prompt: string,
  parser: (p: string) => Promise<LLMVettingResponse>,
  providerName: string
): Promise<LLMVettingResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await parser(prompt);
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

/**
 * Validate and normalize LLM response.
 */
function validateAndNormalize(data: LLMVettingResponse): {
  breakdown: BrandVettingResult["breakdown"];
  findings: BrandFinding[];
  redFlags: BrandRedFlag[];
  recommendations: string[];
  dataSources: string[];
} {
  // Clamp scores to 0-25
  const clampScore = (score: number) => Math.max(0, Math.min(25, score));

  const breakdown: BrandVettingResult["breakdown"] = {
    socialPresence: {
      score: clampScore(data.socialPresence?.score ?? 10),
      confidence: data.socialPresence?.confidence ?? "low",
      details: data.socialPresence?.details ?? ["Limited information available"],
    },
    websiteVerification: {
      score: clampScore(data.websiteVerification?.score ?? 10),
      confidence: data.websiteVerification?.confidence ?? "low",
      details: data.websiteVerification?.details ?? ["Unable to verify website"],
    },
    collaborationHistory: {
      score: clampScore(data.collaborationHistory?.score ?? 10),
      confidence: data.collaborationHistory?.confidence ?? "low",
      details: data.collaborationHistory?.details ?? ["No collaboration history found"],
    },
    scamIndicators: {
      score: clampScore(data.scamIndicators?.score ?? 20),
      confidence: data.scamIndicators?.confidence ?? "low",
      details: data.scamIndicators?.details ?? ["No obvious red flags detected"],
    },
  };

  // Process findings
  const findings: BrandFinding[] = (data.findings ?? []).map((f) => ({
    category: f.category ?? "scam_check",
    finding: f.finding ?? "",
    evidence: f.evidence ?? undefined,
    sentiment: f.sentiment ?? "neutral",
  }));

  // Process red flags
  const redFlags: BrandRedFlag[] = (data.scamIndicators?.redFlagsFound ?? []).map((rf) => ({
    severity: rf.severity ?? "medium",
    flag: rf.flag ?? "Unknown concern",
    explanation: rf.explanation ?? "",
    source: "LLM analysis",
  }));

  const recommendations = data.recommendations ?? [];
  const dataSources = data.dataSources ?? ["General knowledge"];

  return { breakdown, findings, redFlags, recommendations, dataSources };
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Vet a brand for legitimacy and trustworthiness.
 *
 * Performs 4 checks to calculate a trust score:
 * 1. Social Presence (25 pts)
 * 2. Website Verification (25 pts)
 * 3. Collaboration History (25 pts)
 * 4. Scam Indicators (25 pts inverse)
 *
 * @param input - Brand information to vet
 * @returns Complete vetting result with trust score and breakdown
 */
export async function vetBrand(input: BrandVettingInput): Promise<BrandVettingResult> {
  // Validate input
  if (!input.brandName || input.brandName.trim().length < 2) {
    throw new Error("Brand name must be at least 2 characters");
  }

  // Check website if provided
  let websiteCheck: { exists: boolean; isHttps: boolean } | undefined;
  if (input.brandWebsite) {
    websiteCheck = await checkWebsiteExists(input.brandWebsite);
  }

  // Build prompt
  const prompt = buildVettingPrompt(input, websiteCheck);

  // Try Groq first
  let llmResult: LLMVettingResponse;
  try {
    llmResult = await parseWithRetry(prompt, parseWithGroq, "Groq");
  } catch (groqError) {
    console.warn("Groq failed, falling back to Gemini:", groqError);

    // Fall back to Gemini
    try {
      llmResult = await parseWithRetry(prompt, parseWithGemini, "Gemini");
    } catch (geminiError) {
      console.error("Both Groq and Gemini failed:", geminiError);
      throw new Error(
        "Failed to vet brand with all available providers. Please try again later."
      );
    }
  }

  // Validate and normalize response
  const { breakdown, findings, redFlags, recommendations, dataSources } =
    validateAndNormalize(llmResult);

  // Adjust website score based on actual check
  if (websiteCheck) {
    if (!websiteCheck.exists) {
      // Website doesn't exist, reduce score
      breakdown.websiteVerification.score = Math.min(breakdown.websiteVerification.score, 8);
      breakdown.websiteVerification.details.push("Website could not be reached");
    } else if (!websiteCheck.isHttps) {
      // No HTTPS, slight reduction
      breakdown.websiteVerification.score = Math.max(0, breakdown.websiteVerification.score - 3);
      breakdown.websiteVerification.details.push("Website does not use HTTPS");
    }
  }

  // Calculate total score
  const trustScore =
    breakdown.socialPresence.score +
    breakdown.websiteVerification.score +
    breakdown.collaborationHistory.score +
    breakdown.scamIndicators.score;

  // Clamp to 0-100
  const clampedScore = Math.max(0, Math.min(100, trustScore));
  const trustLevel = getTrustLevel(clampedScore);

  // Add default recommendation if none
  const finalRecommendations =
    recommendations.length > 0
      ? recommendations
      : [getDefaultRecommendation(trustLevel)];

  return {
    trustScore: clampedScore,
    trustLevel,
    breakdown,
    findings,
    redFlags,
    recommendations: finalRecommendations,
    checkedAt: new Date(),
    dataSources,
    cached: false,
  };
}

/**
 * Get a default recommendation based on trust level.
 */
function getDefaultRecommendation(level: TrustLevel): string {
  switch (level) {
    case "verified":
      return "This brand appears legitimate. Proceed with normal due diligence.";
    case "likely_legit":
      return "This brand looks okay. Verify payment terms and get everything in writing.";
    case "caution":
      return "Proceed carefully. Ask clarifying questions about compensation and expectations before committing.";
    case "high_risk":
      return "Multiple red flags detected. Consider declining or requesting significantly more information before proceeding.";
  }
}

/**
 * Create a cache key for brand vetting.
 */
export function createCacheKey(input: BrandVettingInput): string {
  const normalizedName = input.brandName.toLowerCase().trim();
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `brand:${normalizedName}:${date}`;
}

/**
 * Check if input is valid for vetting.
 */
export function isValidVettingInput(input: unknown): input is BrandVettingInput {
  if (!input || typeof input !== "object") return false;
  const obj = input as Record<string, unknown>;
  return (
    typeof obj.brandName === "string" &&
    obj.brandName.length >= 2 &&
    typeof obj.platform === "string"
  );
}
