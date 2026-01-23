/**
 * Contract Scanner Module
 *
 * Analyzes influencer contracts using LLM to identify:
 * - Found clauses (good, concerning, red flags)
 * - Missing critical clauses
 * - Contract red flags
 * - Overall health score
 *
 * Uses Groq (llama-3.3-70b-versatile) as primary provider
 * with Google Gemini as fallback.
 */

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  ContractScanInput,
  ContractScanResult,
  ContractCategoryAnalysis,
  FoundClause,
  MissingClause,
  ContractScanRedFlag,
  ContractHealthLevel,
  ContractScanCategory,
} from "./types";

// Re-export types for convenience
export type {
  ContractScanInput,
  ContractScanResult,
  ContractCategoryAnalysis,
  FoundClause,
  MissingClause,
  ContractScanRedFlag,
  ContractHealthLevel,
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MIN_CONTRACT_LENGTH = 100;

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

const CONTRACT_SCANNER_SYSTEM_PROMPT = `You are an expert contract analyst specializing in influencer marketing agreements. Analyze the provided contract and extract structured information to help creators understand and negotiate better terms.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "categories": {
    "payment": {
      "score": number (0-25),
      "status": "complete" | "partial" | "missing",
      "findings": ["string"]
    },
    "contentRights": {
      "score": number (0-25),
      "status": "complete" | "partial" | "missing",
      "findings": ["string"]
    },
    "exclusivity": {
      "score": number (0-25),
      "status": "complete" | "partial" | "missing",
      "findings": ["string"]
    },
    "legal": {
      "score": number (0-25),
      "status": "complete" | "partial" | "missing",
      "findings": ["string"]
    }
  },
  "foundClauses": [
    {
      "category": "payment" | "contentRights" | "exclusivity" | "legal",
      "item": "string",
      "quote": "string (exact quote from contract)",
      "assessment": "good" | "concerning" | "red_flag",
      "note": "string or null"
    }
  ],
  "missingClauses": [
    {
      "category": "payment" | "contentRights" | "exclusivity" | "legal",
      "item": "string",
      "importance": "critical" | "important" | "recommended",
      "suggestion": "string"
    }
  ],
  "redFlags": [
    {
      "severity": "high" | "medium" | "low",
      "clause": "string",
      "quote": "string or null",
      "explanation": "string",
      "suggestion": "string"
    }
  ],
  "recommendations": ["string"]
}

ANALYSIS GUIDELINES:

PAYMENT CATEGORY (25 points):
Check for and score:
- Payment amount clearly stated (critical)
- Payment timeline (Net-15, Net-30, etc.) (critical)
- Late payment penalty clause (important)
- Deposit/upfront payment (50% recommended) (important)
- Kill fee if brand cancels (25-50% recommended) (important)

CONTENT & RIGHTS CATEGORY (25 points):
Check for and score:
- Deliverables clearly defined (critical)
- Revision rounds limited (max 2 recommended) (critical)
- Usage rights duration specified (critical)
- Usage channels specified (organic, paid, OOH) (critical)
- Territory specified (important)
- Creator retains raw content ownership (important)

EXCLUSIVITY CATEGORY (25 points):
Check for and score:
- Exclusivity period defined (if any) (critical)
- Exclusivity scope defined (category, full) (critical)
- Exclusivity compensated appropriately (critical)
Note: If no exclusivity is mentioned, score full points (good for creator)

LEGAL CATEGORY (25 points):
Check for and score:
- Termination clause exists (important)
- Dispute resolution specified (important)
- No unreasonable liability on creator (important)
- FTC compliance language included (important)

RED FLAGS TO DETECT (mark as high severity):
- Perpetual/unlimited usage rights without major premium
- No payment for usage rights when whitelisting requested
- Exclusivity without compensation
- Payment terms beyond Net-60
- Unlimited revisions
- Moral rights waiver
- Overly broad non-disparagement
- Work for hire language (creator loses all ownership)

SCORING GUIDELINES:
- Each category is worth 25 points max
- Critical items missing = -5 to -10 points
- Important items missing = -2 to -5 points
- Concerning clauses = -2 to -5 points
- Red flag clauses = -5 to -10 points
- Good clauses = full points

QUOTE GUIDELINES:
- Always quote exact contract language when identifying clauses
- Keep quotes concise but complete enough for context
- If quoting, use the exact wording from the contract

RECOMMENDATIONS:
- Provide 3-5 actionable recommendations
- Prioritize by importance (most critical first)
- Be specific about what to ask for`;

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
 * Determine health level from score.
 */
export function getHealthLevel(score: number): ContractHealthLevel {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

/**
 * Calculate total health score from category scores.
 */
function calculateHealthScore(categories: ContractScanResult["categories"]): number {
  return (
    categories.payment.score +
    categories.contentRights.score +
    categories.exclusivity.score +
    categories.legal.score
  );
}

/**
 * Generate a change request email template based on scan results.
 */
export function generateChangeRequest(
  result: ContractScanResult,
  creatorName?: string
): string {
  const name = creatorName || "[Your Name]";
  const criticalMissing = result.missingClauses.filter((c) => c.importance === "critical");
  const highRedFlags = result.redFlags.filter((f) => f.severity === "high");
  const mediumRedFlags = result.redFlags.filter((f) => f.severity === "medium");

  const changes: string[] = [];

  // Add red flags first (highest priority)
  highRedFlags.forEach((flag, index) => {
    changes.push(`${index + 1}. [HIGH PRIORITY] ${flag.clause}: ${flag.suggestion}`);
  });

  // Add critical missing clauses
  criticalMissing.forEach((clause) => {
    const num = changes.length + 1;
    changes.push(`${num}. [CRITICAL] Add ${clause.item}: ${clause.suggestion}`);
  });

  // Add medium red flags
  mediumRedFlags.forEach((flag) => {
    const num = changes.length + 1;
    changes.push(`${num}. [IMPORTANT] ${flag.clause}: ${flag.suggestion}`);
  });

  // Add important missing clauses
  const importantMissing = result.missingClauses.filter((c) => c.importance === "important");
  importantMissing.forEach((clause) => {
    const num = changes.length + 1;
    changes.push(`${num}. Add ${clause.item}: ${clause.suggestion}`);
  });

  if (changes.length === 0) {
    return `Hi,

Thank you for sending over the contract. I've reviewed it and everything looks good! I'm ready to move forward.

Best,
${name}`;
  }

  return `Hi,

Thank you for sending over the contract. I've reviewed it carefully and have a few requested changes before I can sign:

${changes.join("\n\n")}

I'm excited about this partnership and want to make sure we're both protected. Please let me know if these adjustments work for you.

Best,
${name}`;
}

// =============================================================================
// VALIDATION AND NORMALIZATION
// =============================================================================

/**
 * Validate and normalize LLM output to ContractScanResult structure.
 */
function validateAndNormalize(data: unknown): Omit<ContractScanResult, "healthScore" | "healthLevel" | "changeRequestTemplate"> {
  const parsed = data as Record<string, unknown>;

  // Validate categories
  const categoriesRaw = parsed.categories as Record<string, unknown> | undefined;
  const validStatuses = ["complete", "partial", "missing"];

  function validateCategory(cat: unknown): ContractCategoryAnalysis {
    const catObj = cat as Record<string, unknown> | undefined;
    const score = Math.max(0, Math.min(25, Number(catObj?.score) || 0));
    const status = validStatuses.includes(catObj?.status as string)
      ? (catObj?.status as ContractCategoryAnalysis["status"])
      : "missing";
    const findings = Array.isArray(catObj?.findings)
      ? (catObj.findings as string[]).map(String)
      : [];
    return { score, status, findings };
  }

  const categories = {
    payment: validateCategory(categoriesRaw?.payment),
    contentRights: validateCategory(categoriesRaw?.contentRights),
    exclusivity: validateCategory(categoriesRaw?.exclusivity),
    legal: validateCategory(categoriesRaw?.legal),
  };

  // Validate found clauses
  const validCategories: ContractScanCategory[] = ["payment", "contentRights", "exclusivity", "legal"];
  const validAssessments = ["good", "concerning", "red_flag"];

  const foundClausesRaw = Array.isArray(parsed.foundClauses) ? parsed.foundClauses : [];
  const foundClauses: FoundClause[] = foundClausesRaw
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      category: validCategories.includes(c.category as ContractScanCategory)
        ? (c.category as ContractScanCategory)
        : "legal",
      item: String(c.item || ""),
      quote: String(c.quote || ""),
      assessment: validAssessments.includes(c.assessment as string)
        ? (c.assessment as FoundClause["assessment"])
        : "concerning",
      note: c.note ? String(c.note) : undefined,
    }))
    .filter((c) => c.item && c.quote);

  // Validate missing clauses
  const validImportances = ["critical", "important", "recommended"];
  const missingClausesRaw = Array.isArray(parsed.missingClauses) ? parsed.missingClauses : [];
  const missingClauses: MissingClause[] = missingClausesRaw
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      category: validCategories.includes(c.category as ContractScanCategory)
        ? (c.category as ContractScanCategory)
        : "legal",
      item: String(c.item || ""),
      importance: validImportances.includes(c.importance as string)
        ? (c.importance as MissingClause["importance"])
        : "recommended",
      suggestion: String(c.suggestion || ""),
    }))
    .filter((c) => c.item && c.suggestion);

  // Validate red flags
  const validSeverities = ["high", "medium", "low"];
  const redFlagsRaw = Array.isArray(parsed.redFlags) ? parsed.redFlags : [];
  const redFlags: ContractScanRedFlag[] = redFlagsRaw
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({
      severity: validSeverities.includes(f.severity as string)
        ? (f.severity as ContractScanRedFlag["severity"])
        : "medium",
      clause: String(f.clause || ""),
      quote: f.quote ? String(f.quote) : undefined,
      explanation: String(f.explanation || ""),
      suggestion: String(f.suggestion || ""),
    }))
    .filter((f) => f.clause && f.explanation && f.suggestion);

  // Validate recommendations
  const recommendationsRaw = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  const recommendations = recommendationsRaw
    .filter((r): r is string => typeof r === "string")
    .filter((r) => r.trim().length > 0);

  return {
    categories,
    foundClauses,
    missingClauses,
    redFlags,
    recommendations,
  };
}

// =============================================================================
// LLM PARSING FUNCTIONS
// =============================================================================

/**
 * Parse contract using Groq API.
 */
async function parseWithGroq(contractText: string): Promise<Record<string, unknown>> {
  const client = getGroqClient();

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: CONTRACT_SCANNER_SYSTEM_PROMPT },
      { role: "user", content: `Analyze this influencer contract:\n\n${contractText}` },
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
 * Parse contract using Gemini API.
 */
async function parseWithGemini(contractText: string): Promise<Record<string, unknown>> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const prompt = `${CONTRACT_SCANNER_SYSTEM_PROMPT}\n\nAnalyze this influencer contract:\n\n${contractText}`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();

  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(content);
}

/**
 * Attempt to parse a contract with retry logic.
 */
async function parseWithRetry(
  contractText: string,
  parser: (text: string) => Promise<Record<string, unknown>>,
  providerName: string
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await parser(contractText);
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
// MAIN EXPORTS
// =============================================================================

/**
 * Scan a contract and return detailed analysis.
 *
 * Uses Groq as primary provider, falls back to Gemini on error.
 * Analyzes against 4 categories: payment, content rights, exclusivity, legal.
 *
 * @param input - Contract text and optional deal context
 * @returns Complete contract scan result with health score and recommendations
 * @throws Error if both providers fail or input is invalid
 */
export async function scanContract(input: ContractScanInput): Promise<ContractScanResult> {
  // Validate input
  if (!input.contractText || input.contractText.trim().length < MIN_CONTRACT_LENGTH) {
    throw new Error(
      `Contract text must be at least ${MIN_CONTRACT_LENGTH} characters long`
    );
  }

  const trimmedText = input.contractText.trim();

  // Build context string if deal context provided
  let contextString = "";
  if (input.dealContext) {
    const parts: string[] = [];
    if (input.dealContext.platform) {
      parts.push(`Platform: ${input.dealContext.platform}`);
    }
    if (input.dealContext.dealType) {
      parts.push(`Deal Type: ${input.dealContext.dealType}`);
    }
    if (input.dealContext.offeredRate) {
      parts.push(`Offered Rate: $${input.dealContext.offeredRate}`);
    }
    if (parts.length > 0) {
      contextString = `\n\nDeal Context:\n${parts.join("\n")}\n\n`;
    }
  }

  const fullText = contextString + trimmedText;

  // Try Groq first
  let llmResult: Record<string, unknown>;
  try {
    llmResult = await parseWithRetry(fullText, parseWithGroq, "Groq");
  } catch (groqError) {
    console.warn("Groq failed, falling back to Gemini:", groqError);

    // Fall back to Gemini
    try {
      llmResult = await parseWithRetry(fullText, parseWithGemini, "Gemini");
    } catch (geminiError) {
      console.error("Both Groq and Gemini failed:", geminiError);
      throw new Error(
        "Failed to analyze contract with all available providers. Please try again later."
      );
    }
  }

  // Validate and normalize the LLM output
  const baseResult = validateAndNormalize(llmResult);

  // Calculate health score
  const healthScore = calculateHealthScore(baseResult.categories);
  const healthLevel = getHealthLevel(healthScore);

  // Generate change request template
  const partialResult = {
    ...baseResult,
    healthScore,
    healthLevel,
    changeRequestTemplate: "",
  };
  const changeRequestTemplate = generateChangeRequest(partialResult);

  return {
    ...baseResult,
    healthScore,
    healthLevel,
    changeRequestTemplate,
  };
}

/**
 * Check if contract text meets minimum requirements.
 */
export function isValidContractText(text: string): boolean {
  return text.trim().length >= MIN_CONTRACT_LENGTH;
}

/**
 * Get minimum contract text length requirement.
 */
export function getMinContractLength(): number {
  return MIN_CONTRACT_LENGTH;
}
