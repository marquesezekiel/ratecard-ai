"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { DMParserForm } from "@/components/forms/dm-parser-form";
import { BriefReviewForm } from "@/components/forms/brief-review-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Tabs removed - using custom tab buttons to keep form state stable
import { ProgressSteps } from "@/components/ui/progress-steps";
import { AlertCircle, Loader2, MessageSquare, FileText, Upload } from "lucide-react";
import type { DMAnalysis, ParsedBrief, ApiResponse } from "@/lib/types";
import { useProfile } from "@/hooks/use-profile";

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

type ParseStep = "idle" | "uploading" | "extracting" | "analyzing" | "complete" | "error";

function getStepStatus(currentStep: ParseStep, targetStep: ParseStep): "pending" | "active" | "complete" {
  const stepOrder: ParseStep[] = ["uploading", "extracting", "analyzing", "complete"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);

  if (currentIndex === targetIndex) return "active";
  if (currentIndex > targetIndex) return "complete";
  return "pending";
}

export default function AnalyzeDMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoading: profileLoading } = useProfile();
  const [lastAnalysis, setLastAnalysis] = useState<DMAnalysis | null>(null);

  // Get pre-filled message and tab from query params
  const initialMessage = searchParams.get("message") || "";
  const initialTab = searchParams.get("tab") === "briefs" ? "briefs" : "messages";
  const [activeTab, setActiveTab] = useState<"messages" | "briefs">(initialTab);

  // Track if we're showing results (fullscreen mode)
  const showingResults = lastAnalysis !== null;

  // Brief upload state
  const [parseStep, setParseStep] = useState<ParseStep>("idle");
  const [briefError, setBriefError] = useState<string | null>(null);
  const [parsedBrief, setParsedBrief] = useState<ParsedBrief | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isLoading = parseStep !== "idle" && parseStep !== "error" && parseStep !== "complete";

  // Redirect to onboarding if no profile (consolidated entry point)
  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push("/onboarding");
    }
  }, [profileLoading, profile, router]);

  const parseBriefFromFile = useCallback(async (file: File) => {
    setParseStep("uploading");
    setBriefError(null);
    setParsedBrief(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setParseStep("extracting");

      const formData = new FormData();
      formData.append("file", file);

      await new Promise(resolve => setTimeout(resolve, 300));
      setParseStep("analyzing");

      const response = await fetch("/api/parse-brief", {
        method: "POST",
        body: formData,
      });

      const result: ApiResponse<Omit<ParsedBrief, "id">> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to parse brief");
      }

      setParseStep("complete");
      const brief = result.data as ParsedBrief;
      setParsedBrief(brief);
    } catch (err) {
      setParseStep("error");
      setBriefError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: { file: File }[]) => {
    setBriefError(null);

    if (fileRejections.length > 0) {
      setBriefError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      parseBriefFromFile(file);
    }
  }, [parseBriefFromFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    disabled: isLoading,
  });

  const handleConfirmBrief = (brief: Omit<ParsedBrief, "id">) => {
    localStorage.setItem("currentBrief", JSON.stringify(brief));
    router.push("/dashboard/generate");
  };

  const handleResetBrief = () => {
    setSelectedFile(null);
    setParsedBrief(null);
    setBriefError(null);
    setParseStep("idle");
  };

  // Loading state (also covers redirect to onboarding)
  if (profileLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleAnalysisComplete = (analysis: DMAnalysis) => {
    setLastAnalysis(analysis);
  };

  const handleAnalysisReset = () => {
    setLastAnalysis(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - hide when showing results in messages tab */}
      {!(showingResults && activeTab === "messages") && (
        <header className="space-y-1">
          <h1 className="text-2xl font-display font-bold">Analyze a Deal</h1>
          <p className="text-muted-foreground">
            Got a brand message? Paste it here. We&apos;ll tell you what to charge and write your response.
          </p>
        </header>
      )}

      {/* Tab list - hide when showing results in messages tab */}
      {!(showingResults && activeTab === "messages") && (
        <div className="w-full border-b">
          <div className="grid w-full grid-cols-2">
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "messages"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </button>
            <button
              onClick={() => setActiveTab("briefs")}
              className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "briefs"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              Brand Briefs
            </button>
          </div>
        </div>
      )}

      {/* Messages Tab Content - always in same tree position */}
      {activeTab === "messages" && (
        <DMParserForm
          profile={profile}
          initialMessage={initialMessage}
          onAnalysisComplete={handleAnalysisComplete}
          onReset={handleAnalysisReset}
        />
      )}

      {/* Briefs Tab Content */}
      {activeTab === "briefs" && (
        <>
          {/* If brief is parsed, show the review form */}
          {parsedBrief && parseStep === "complete" ? (
            <BriefReviewForm
              initialBrief={parsedBrief}
              onConfirm={handleConfirmBrief}
              onReparse={handleResetBrief}
            />
          ) : isLoading ? (
            /* Show progress steps during parsing */
            <Card>
              <CardHeader>
                <CardTitle>Reading your brief...</CardTitle>
                <CardDescription>
                  Pulling out the important stuff — brand, deliverables, timeline, rights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-6">
                  <ProgressSteps
                    steps={[
                      {
                        label: "Uploading file",
                        status: getStepStatus(parseStep, "uploading"),
                      },
                      {
                        label: "Extracting text",
                        status: getStepStatus(parseStep, "extracting"),
                      },
                      {
                        label: "AI analyzing brief",
                        status: getStepStatus(parseStep, "analyzing"),
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Upload zone */
            <Card data-tour="brief-upload">
              <CardHeader>
                <CardTitle>Upload a Brief</CardTitle>
                <CardDescription>
                  Drop that PDF or Word doc. We&apos;ll pull out the details and give you a rate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors
                    ${isDragActive && !isDragReject ? "border-primary bg-primary/5" : ""}
                    ${isDragReject ? "border-destructive bg-destructive/5" : ""}
                    ${!isDragActive && !isDragReject ? "border-muted-foreground/25 hover:border-primary/50" : ""}
                  `}
                >
                  <input {...getInputProps()} />

                  {selectedFile && parseStep === "error" ? (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-10 w-10 text-destructive" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Click or drag to try a different file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {isDragActive ? "Drop your file here" : "Drag & drop your brief"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          or click to browse
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, DOCX, and TXT files
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {briefError && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Failed to parse brief</p>
                      <p className="text-sm opacity-90">{briefError}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
