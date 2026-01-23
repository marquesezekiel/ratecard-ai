import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { scanContract, getMinContractLength } from "@/lib/contract-scanner";
import { extractTextFromFile } from "@/lib/brief-parser";
import type { ApiResponse, ContractScanResult, ContractScanInput } from "@/lib/types";

/**
 * POST /api/scan-contract
 *
 * Scan a contract to analyze clauses, detect red flags, and identify missing terms.
 *
 * Supports two input modes:
 *
 * 1. Text input (application/json):
 *    { contractText: string, dealContext?: { platform?, dealType?, offeredRate? } }
 *
 * 2. File upload (multipart/form-data):
 *    - file: File (PDF or DOCX)
 *    - dealContext?: JSON string of deal context
 *
 * Returns: ApiResponse<ContractScanResult>
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ContractScanResult>>> {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    // Determine content type
    const contentType = request.headers.get("content-type") || "";

    // Handle multipart/form-data (file upload)
    if (contentType.includes("multipart/form-data")) {
      return await handleFileUpload(request);
    }

    // Handle application/json (text input)
    return await handleJsonInput(request);
  } catch (error) {
    console.error("Contract scanning error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred while analyzing the contract.";

    // Return 400 for known validation errors
    if (
      errorMessage.includes("characters long") ||
      errorMessage.includes("Unsupported file type") ||
      errorMessage.includes("Failed to extract")
    ) {
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    // Return 500 for unexpected errors
    return NextResponse.json(
      { success: false, error: "Failed to analyze contract. Please try again or contact support." },
      { status: 500 }
    );
  }
}

/**
 * Handle JSON input (text).
 */
async function handleJsonInput(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ContractScanResult>>> {
  const body = await request.json();

  const { contractText, dealContext } = body as {
    contractText: string | undefined;
    dealContext?: ContractScanInput["dealContext"];
  };

  // Validate required inputs
  if (!contractText || typeof contractText !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing contract text. Please provide the contract content to analyze." },
      { status: 400 }
    );
  }

  const minLength = getMinContractLength();
  if (contractText.trim().length < minLength) {
    return NextResponse.json(
      { success: false, error: `Contract text must be at least ${minLength} characters long.` },
      { status: 400 }
    );
  }

  // Scan the contract
  const result = await scanContract({
    contractText: contractText.trim(),
    dealContext,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}

/**
 * Handle multipart/form-data file upload.
 */
async function handleFileUpload(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ContractScanResult>>> {
  const formData = await request.formData();

  // Get the file
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { success: false, error: "Missing file. Please upload a PDF or DOCX contract." },
      { status: 400 }
    );
  }

  // Validate file type
  const filename = file.name.toLowerCase();
  if (!filename.endsWith(".pdf") && !filename.endsWith(".docx") && !filename.endsWith(".txt")) {
    return NextResponse.json(
      { success: false, error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
      { status: 400 }
    );
  }

  // Get optional deal context
  let dealContext: ContractScanInput["dealContext"] | undefined;
  const dealContextJson = formData.get("dealContext") as string | null;
  if (dealContextJson) {
    try {
      dealContext = JSON.parse(dealContextJson) as ContractScanInput["dealContext"];
    } catch {
      // Ignore invalid JSON, just proceed without context
    }
  }

  // Extract text from file
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contractText = await extractTextFromFile(buffer, file.name);

  const minLength = getMinContractLength();
  if (contractText.trim().length < minLength) {
    return NextResponse.json(
      {
        success: false,
        error: `Extracted text is too short (${contractText.trim().length} characters). Contract must have at least ${minLength} characters of content.`
      },
      { status: 400 }
    );
  }

  // Scan the contract
  const result = await scanContract({
    contractText: contractText.trim(),
    dealContext,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/scan-contract
 *
 * Returns information about supported formats and limits.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      supportedFormats: [".pdf", ".docx", ".txt"],
      minContractLength: getMinContractLength(),
      inputModes: [
        {
          mode: "text",
          contentType: "application/json",
          description: "Paste contract text directly",
          body: {
            contractText: "string (required)",
            dealContext: "{ platform?, dealType?, offeredRate? } (optional)"
          },
        },
        {
          mode: "file",
          contentType: "multipart/form-data",
          description: "Upload a contract file",
          body: {
            file: "File (PDF, DOCX, or TXT)",
            dealContext: "JSON string (optional)"
          },
        },
      ],
    },
  });
}
