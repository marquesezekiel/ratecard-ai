/**
 * LLM Client for Brief Parsing
 *
 * Uses Groq (llama-3.1-70b-versatile) as primary provider with
 * Google Gemini (gemini-1.5-flash) as fallback.
 * Includes retry logic with exponential backoff.
 */

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ParsedBrief, Platform, ContentFormat, ExclusivityLevel } from "./types";

// Type for the parsed brief output (without id and rawText which are added later)
type ParsedBriefOutput = Omit<ParsedBrief, "id" | "rawText">;

// System prompt for brief parsing
const SYSTEM_PROMPT = `You are an expert at parsing brand campaign briefs. Extract structured information from the following brief text.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "brand": { "name": "", "industry": "", "product": "" },
  "campaign": { "objective": "", "targetAudience": "", "budgetRange": "" },
  "content": { "platform": "", "format": "", "quantity": 1, "creativeDirection": "" },
  "usageRights": { "durationDays": 0, "exclusivity": "none", "paidAmplification": false },
  "timeline": { "deadline": "" }
}

Field guidelines:
- platform: Must be one of: "instagram", "tiktok", "youtube", "twitter"
- format: Must be one of: "static", "carousel", "story", "reel", "video", "live", "ugc"
- exclusivity: Must be one of: "none", "category", "full"
- quantity: Number of deliverables (default to 1 if not specified)
- durationDays: Usage rights duration in days (0 if not specified, 365 for perpetual/unlimited)
- paidAmplification: true if brand can use content in paid ads

If information is not found in the brief, use reasonable defaults or empty strings.`;

// Configuration
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// Initialize clients lazily to avoid errors when env vars are missing
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

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function getBackoffDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Validate and normalize the parsed brief data
 */
function validateAndNormalize(data: unknown): ParsedBriefOutput {
  const parsed = data as Record<string, unknown>;

  // Validate platform
  const validPlatforms: Platform[] = ["instagram", "tiktok", "youtube", "twitter"];
  const platform = ((parsed.content as Record<string, unknown>)?.platform as string || "instagram").toLowerCase();
  const normalizedPlatform: Platform = validPlatforms.includes(platform as Platform)
    ? (platform as Platform)
    : "instagram";

  // Validate format
  const validFormats: ContentFormat[] = ["static", "carousel", "story", "reel", "video", "live", "ugc"];
  const format = ((parsed.content as Record<string, unknown>)?.format as string || "static").toLowerCase();
  const normalizedFormat: ContentFormat = validFormats.includes(format as ContentFormat)
    ? (format as ContentFormat)
    : "static";

  // Validate exclusivity
  const validExclusivity: ExclusivityLevel[] = ["none", "category", "full"];
  const exclusivity = ((parsed.usageRights as Record<string, unknown>)?.exclusivity as string || "none").toLowerCase();
  const normalizedExclusivity: ExclusivityLevel = validExclusivity.includes(exclusivity as ExclusivityLevel)
    ? (exclusivity as ExclusivityLevel)
    : "none";

  const brand = parsed.brand as Record<string, unknown> || {};
  const campaign = parsed.campaign as Record<string, unknown> || {};
  const content = parsed.content as Record<string, unknown> || {};
  const usageRights = parsed.usageRights as Record<string, unknown> || {};
  const timeline = parsed.timeline as Record<string, unknown> || {};

  return {
    brand: {
      name: String(brand.name || ""),
      industry: String(brand.industry || ""),
      product: String(brand.product || ""),
    },
    campaign: {
      objective: String(campaign.objective || ""),
      targetAudience: String(campaign.targetAudience || ""),
      budgetRange: String(campaign.budgetRange || ""),
    },
    content: {
      platform: normalizedPlatform,
      format: normalizedFormat,
      quantity: Math.max(1, Number(content.quantity) || 1),
      creativeDirection: String(content.creativeDirection || ""),
    },
    usageRights: {
      durationDays: Math.max(0, Number(usageRights.durationDays) || 0),
      exclusivity: normalizedExclusivity,
      paidAmplification: Boolean(usageRights.paidAmplification),
    },
    timeline: {
      deadline: String(timeline.deadline || ""),
    },
  };
}

/**
 * Parse brief using Groq API
 */
async function parseWithGroq(text: string): Promise<ParsedBriefOutput> {
  const client = getGroqClient();

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq");
  }

  const parsed = JSON.parse(content);
  return validateAndNormalize(parsed);
}

/**
 * Parse brief using Gemini API
 */
async function parseWithGemini(text: string): Promise<ParsedBriefOutput> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const prompt = `${SYSTEM_PROMPT}\n\nBrief to parse:\n${text}`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();

  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  const parsed = JSON.parse(content);
  return validateAndNormalize(parsed);
}

/**
 * Attempt to parse a brief with retry logic
 */
async function parseWithRetry(
  text: string,
  parser: (text: string) => Promise<ParsedBriefOutput>,
  providerName: string
): Promise<ParsedBriefOutput> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await parser(text);
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
 * Parse a brand brief using LLM.
 * Uses Groq as primary provider, falls back to Gemini on error.
 *
 * @param text - Raw text content from the brief
 * @returns Parsed brief data (without id and rawText)
 * @throws Error if both providers fail
 */
export async function parseBriefWithLLM(text: string): Promise<ParsedBriefOutput> {
  // Try Groq first
  try {
    return await parseWithRetry(text, parseWithGroq, "Groq");
  } catch (groqError) {
    console.warn("Groq failed, falling back to Gemini:", groqError);
  }

  // Fall back to Gemini
  try {
    return await parseWithRetry(text, parseWithGemini, "Gemini");
  } catch (geminiError) {
    console.error("Both Groq and Gemini failed:", geminiError);
    throw new Error(
      "Failed to parse brief with all available providers. Please try again later."
    );
  }
}
