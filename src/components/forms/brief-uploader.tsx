"use client";

import { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProgressSteps } from "@/components/ui/progress-steps";
import type { ParsedBrief, ApiResponse } from "@/lib/types";

interface BriefUploaderProps {
  onBriefParsed: (brief: ParsedBrief) => void;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

const MIN_TEXT_LENGTH = 50;

type ParseStep = "idle" | "uploading" | "extracting" | "analyzing" | "complete" | "error";

function getStepStatus(currentStep: ParseStep, targetStep: ParseStep): "pending" | "active" | "complete" {
  const stepOrder: ParseStep[] = ["uploading", "extracting", "analyzing", "complete"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);

  if (currentIndex === targetIndex) return "active";
  if (currentIndex > targetIndex) return "complete";
  return "pending";
}

export function BriefUploader({ onBriefParsed }: BriefUploaderProps) {
  const [parseStep, setParseStep] = useState<ParseStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsedBrief, setParsedBrief] = useState<ParsedBrief | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const isLoading = parseStep !== "idle" && parseStep !== "error" && parseStep !== "complete";

  const parseBriefFromFile = useCallback(async (file: File) => {
    setParseStep("uploading");
    setError(null);
    setParsedBrief(null);

    try {
      // Brief delay to show uploading state
      await new Promise(resolve => setTimeout(resolve, 300));
      setParseStep("extracting");

      const formData = new FormData();
      formData.append("file", file);

      // Brief delay to show extracting state
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

      // Small delay to show completion before transitioning
      setTimeout(() => {
        onBriefParsed(brief);
      }, 500);
    } catch (err) {
      setParseStep("error");
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  }, [onBriefParsed]);

  const parseBriefFromText = async () => {
    if (pastedText.length < MIN_TEXT_LENGTH) {
      setError(`Brief text must be at least ${MIN_TEXT_LENGTH} characters`);
      return;
    }

    setParseStep("uploading");
    setError(null);
    setParsedBrief(null);

    try {
      // Brief delay to show uploading state
      await new Promise(resolve => setTimeout(resolve, 200));
      setParseStep("extracting");

      // Brief delay to show extracting state
      await new Promise(resolve => setTimeout(resolve, 200));
      setParseStep("analyzing");

      const response = await fetch("/api/parse-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: pastedText }),
      });

      const result: ApiResponse<Omit<ParsedBrief, "id">> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to parse brief");
      }

      setParseStep("complete");
      const brief = result.data as ParsedBrief;
      setParsedBrief(brief);

      // Small delay to show completion before transitioning
      setTimeout(() => {
        onBriefParsed(brief);
      }, 500);
    } catch (err) {
      setParseStep("error");
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);

    if (fileRejections.length > 0) {
      setError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
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

  const handleProceed = () => {
    if (parsedBrief) {
      onBriefParsed(parsedBrief);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPastedText("");
    setParsedBrief(null);
    setError(null);
    setParseStep("idle");
  };

  const formatLabel = (format: string): string => {
    const labels: Record<string, string> = {
      static: "Static Post",
      carousel: "Carousel",
      story: "Story",
      reel: "Reel",
      video: "Video",
      live: "Live Stream",
      ugc: "UGC",
    };
    return labels[format] || format;
  };

  const platformLabel = (platform: string): string => {
    const labels: Record<string, string> = {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      twitter: "X (Twitter)",
    };
    return labels[platform] || platform;
  };

  // If brief is parsed, show the results
  if (parsedBrief && parseStep === "complete") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Brief Parsed Successfully</CardTitle>
          </div>
          <CardDescription>
            Review the extracted information below before generating your rate card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Collapsible Brief Details */}
          <div className="rounded-lg border bg-muted/30">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="font-medium">Brief Details</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-2 space-y-4">
                {/* Brand Info */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Brand</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{parsedBrief.brand.name}</Badge>
                    <Badge variant="secondary">{parsedBrief.brand.industry}</Badge>
                  </div>
                  {parsedBrief.brand.product && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Product: {parsedBrief.brand.product}
                    </p>
                  )}
                </div>

                {/* Content Requirements */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Content</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{platformLabel(parsedBrief.content.platform)}</Badge>
                    <Badge variant="outline">{formatLabel(parsedBrief.content.format)}</Badge>
                    <Badge variant="secondary">
                      {parsedBrief.content.quantity} deliverable{parsedBrief.content.quantity !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {/* Usage Rights */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Usage Rights</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {parsedBrief.usageRights.durationDays === 0
                        ? "Content Only"
                        : parsedBrief.usageRights.durationDays >= 365
                        ? "Perpetual"
                        : `${parsedBrief.usageRights.durationDays} days`}
                    </Badge>
                    {parsedBrief.usageRights.exclusivity !== "none" && (
                      <Badge variant="secondary">
                        {parsedBrief.usageRights.exclusivity === "category" ? "Category" : "Full"} Exclusivity
                      </Badge>
                    )}
                    {parsedBrief.usageRights.paidAmplification && (
                      <Badge>Paid Ads</Badge>
                    )}
                  </div>
                </div>

                {/* Campaign */}
                {parsedBrief.campaign.objective && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Campaign Objective</h4>
                    <p className="text-sm">{parsedBrief.campaign.objective}</p>
                  </div>
                )}

                {/* Timeline */}
                {parsedBrief.timeline.deadline && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Deadline</h4>
                    <p className="text-sm">{parsedBrief.timeline.deadline}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleProceed} className="flex-1">
              Continue to Generate Rate Card
            </Button>
            <Button variant="outline" onClick={handleReset} className="sm:flex-initial">
              <span className="hidden sm:inline">Upload Different Brief</span>
              <span className="sm:hidden">Try Another Brief</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show progress steps during parsing
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyzing Your Brief</CardTitle>
          <CardDescription>
            Our AI is extracting the key details from your brief.
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
                  label: "AI analyzing brief (5-10 seconds)",
                  status: getStepStatus(parseStep, "analyzing"),
                },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Brand Brief</CardTitle>
        <CardDescription>
          Upload a brand brief document or paste the text directly. We&apos;ll extract the key details automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upload" className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex-1 gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Paste Text</span>
              <span className="sm:hidden">Paste</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-4">
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

              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Click or drag to replace
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
          </TabsContent>

          {/* Paste Tab */}
          <TabsContent value="paste" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  setError(null);
                }}
                placeholder="Paste the brand brief text here...

Example:
Brand: Glossier
Industry: Beauty
Campaign: Summer Glow Collection Launch

Looking for lifestyle creators to showcase our new Summer Glow collection.
Target audience: Women 18-34 interested in minimal, natural beauty.

Deliverables: 1 Instagram Reel
Usage: 60-day paid media rights
Timeline: Content due in 2 weeks"
                className="min-h-[200px] resize-y"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {pastedText.length < MIN_TEXT_LENGTH
                    ? `Minimum ${MIN_TEXT_LENGTH} characters required`
                    : "Ready to parse"}
                </span>
                <span>{pastedText.length} characters</span>
              </div>
            </div>

            <Button
              onClick={parseBriefFromText}
              disabled={pastedText.length < MIN_TEXT_LENGTH}
              className="w-full"
            >
              Get My Rate
            </Button>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Failed to parse brief</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
