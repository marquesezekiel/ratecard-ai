/**
 * Brief Parser - File Extraction
 *
 * Extracts text from PDF, DOCX, and TXT files, then parses
 * the content into structured brief data using the LLM client.
 */

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { parseBriefWithLLM } from "./llm";
import type { ParsedBrief } from "./types";

// Minimum text length required for parsing (50 characters)
const MIN_TEXT_LENGTH = 50;

// Supported file extensions
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;
type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/**
 * Get the file extension from a filename (lowercase)
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Check if a file extension is supported
 */
function isSupportedExtension(ext: string): ext is SupportedExtension {
  return SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension);
}

/**
 * Extract text from a PDF file using pdf-parse v2 API
 */
async function extractFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text.trim();
}

/**
 * Extract text from a DOCX file
 */
async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

/**
 * Extract text from a plain text file
 */
function extractFromTxt(buffer: Buffer): string {
  return buffer.toString("utf-8").trim();
}

/**
 * Extract text content from a file buffer.
 *
 * Supports PDF, DOCX, and TXT files. Detects file type from extension.
 *
 * @param buffer - File content as a Buffer
 * @param filename - Original filename (used to determine file type)
 * @returns Extracted text content
 * @throws Error if file type is unsupported or extraction fails
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const extension = getFileExtension(filename);

  if (!isSupportedExtension(extension)) {
    throw new Error(
      `Unsupported file type: ${extension || "unknown"}. ` +
        `Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
  }

  try {
    switch (extension) {
      case ".pdf":
        return await extractFromPdf(buffer);
      case ".docx":
        return await extractFromDocx(buffer);
      case ".txt":
        return extractFromTxt(buffer);
      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = extension;
        throw new Error(`Unhandled file type: ${_exhaustive}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unsupported")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from ${filename}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validate that text meets minimum length requirements
 */
function validateTextLength(text: string): void {
  if (text.length < MIN_TEXT_LENGTH) {
    throw new Error(
      `Brief text is too short (${text.length} characters). ` +
        `Please provide at least ${MIN_TEXT_LENGTH} characters of content.`
    );
  }
}

/**
 * Parse a brand brief from a file buffer.
 *
 * Extracts text from the file, validates it, and parses it with the LLM
 * to extract structured brief data.
 *
 * @param buffer - File content as a Buffer
 * @param filename - Original filename (used to determine file type)
 * @returns Parsed brief data with rawText included
 * @throws Error if extraction, validation, or parsing fails
 */
export async function parseBrief(
  buffer: Buffer,
  filename: string
): Promise<Omit<ParsedBrief, "id">> {
  // Extract text from the file
  const rawText = await extractTextFromFile(buffer, filename);

  // Validate text length
  validateTextLength(rawText);

  // Parse with LLM
  const parsedData = await parseBriefWithLLM(rawText);

  return {
    ...parsedData,
    rawText,
  };
}

/**
 * Parse a brand brief from pasted text.
 *
 * Validates the text and parses it with the LLM to extract
 * structured brief data.
 *
 * @param text - Raw text content from the brief
 * @returns Parsed brief data with rawText included
 * @throws Error if validation or parsing fails
 */
export async function parseBriefFromText(
  text: string
): Promise<Omit<ParsedBrief, "id">> {
  const rawText = text.trim();

  // Validate text length
  validateTextLength(rawText);

  // Parse with LLM
  const parsedData = await parseBriefWithLLM(rawText);

  return {
    ...parsedData,
    rawText,
  };
}
