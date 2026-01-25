"use client";

import { useState, useSyncExternalStore, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { DMParserForm } from "@/components/forms/dm-parser-form";
import { BriefReviewForm } from "@/components/forms/brief-review-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, MessageSquare, FileText, Upload, User } from "lucide-react";
import type { CreatorProfile, DMAnalysis, ParsedBrief, ApiResponse } from "@/lib/types";
import { calculateTier } from "@/lib/pricing-engine";

const emptySubscribe = () => () => {};

function useLocalStorageProfile(): CreatorProfile | null | undefined {
  const cacheRef = useRef<{ raw: string | null; parsed: CreatorProfile | null }>({ raw: null, parsed: null });

  const getSnapshot = useCallback(() => {
    const raw = localStorage.getItem("creatorProfile");
    if (raw !== cacheRef.current.raw) {
      cacheRef.current.raw = raw;
      cacheRef.current.parsed = raw ? JSON.parse(raw) as CreatorProfile : null;
    }
    return cacheRef.current.parsed;
  }, []);

  const getServerSnapshot = useCallback((): CreatorProfile | null | undefined => undefined, []);

  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

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
  const profile = useLocalStorageProfile();
  const [, setLastAnalysis] = useState<DMAnalysis | null>(null);

  // Get pre-filled message and tab from query params
  const initialMessage = searchParams.get("message") || "";
  const initialTab = searchParams.get("tab") === "briefs" ? "briefs" : "messages";
  const [activeTab, setActiveTab] = useState<"messages" | "briefs">(initialTab);

  // Brief upload state
  const [parseStep, setParseStep] = useState<ParseStep>("idle");
  const [briefError, setBriefError] = useState<string | null>(null);
  const [parsedBrief, setParsedBrief] = useState<ParsedBrief | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Inline profile capture state (for users without a profile)
  const [inlineProfile, setInlineProfile] = useState<{
    platform: string;
    followers: string;
    engagementRate: string;
  }>({ platform: "instagram", followers: "", engagementRate: "" });
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const isLoading = parseStep !== "idle" && parseStep !== "error" && parseStep !== "complete";

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

  const handleInlineProfileSubmit = useCallback(async () => {
    const followers = parseInt(inlineProfile.followers, 10);
    if (!followers || followers < 100) return;

    setIsCreatingProfile(true);

    try {
      // Create a minimal profile
      const minimalProfile: Partial<CreatorProfile> = {
        displayName: "Creator",
        handle: "creator",
        location: "United States",
        currency: "USD",
        niches: ["lifestyle"],
        tier: calculateTier(followers),
        totalReach: followers,
        avgEngagementRate: parseFloat(inlineProfile.engagementRate) || 3.0,
        [inlineProfile.platform]: {
          followers,
          engagementRate: parseFloat(inlineProfile.engagementRate) || 3.0,
        },
        audience: {
          ageRange: "18-24",
          genderSplit: { male: 40, female: 55, other: 5 },
          topLocations: ["United States"],
          interests: ["lifestyle"],
        },
      };

      // Save to localStorage
      localStorage.setItem("creatorProfile", JSON.stringify(minimalProfile));

      // Force a re-render by reloading - the profile hook will pick up the new value
      window.location.reload();
    } catch (error) {
      console.error("Error creating profile:", error);
      setIsCreatingProfile(false);
    }
  }, [inlineProfile]);

  // Loading state
  if (profile === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No profile state - show inline capture form
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Quick Profile Setup</CardTitle>
            <CardDescription>
              Tell us about your account so we can analyze messages and suggest rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={inlineProfile.platform}
                onValueChange={(value) => setInlineProfile(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="followers">Followers</Label>
              <Input
                id="followers"
                type="number"
                placeholder="e.g., 15000"
                value={inlineProfile.followers}
                onChange={(e) => setInlineProfile(prev => ({ ...prev, followers: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engagement">
                Engagement Rate (%) <span className="text-muted-foreground text-xs">optional</span>
              </Label>
              <Input
                id="engagement"
                type="number"
                step="0.1"
                placeholder="e.g., 4.2"
                value={inlineProfile.engagementRate}
                onChange={(e) => setInlineProfile(prev => ({ ...prev, engagementRate: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                (Likes + Comments) / Followers × 100. We&apos;ll assume 3% if you skip this.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleInlineProfileSubmit}
                disabled={!inlineProfile.followers || parseInt(inlineProfile.followers, 10) < 100 || isCreatingProfile}
                className="w-full"
              >
                {isCreatingProfile ? "Setting up..." : "Continue to Inbox"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/profile")}
                className="text-muted-foreground"
              >
                I want to add more details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAnalysisComplete = (analysis: DMAnalysis) => {
    setLastAnalysis(analysis);
  };

  const handleEvaluateGift = (analysis: DMAnalysis) => {
    // Store the analysis for the gift evaluator page
    sessionStorage.setItem("giftAnalysis", JSON.stringify(analysis));
    router.push("/dashboard/gifts?evaluate=true");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold">Brand Inbox</h1>
        <p className="text-muted-foreground">
          Paste any message from a brand — DMs, emails, screenshots — or upload a brand brief.
          We&apos;ll tell you what it&apos;s worth and how to respond.
        </p>
      </header>

      {/* Tabs for Messages vs Briefs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "messages" | "briefs")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="briefs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Brand Briefs
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab - DM/Email Analysis */}
        <TabsContent value="messages" className="mt-6">
          <DMParserForm
            profile={profile}
            initialMessage={initialMessage}
            onAnalysisComplete={handleAnalysisComplete}
            onEvaluateGift={handleEvaluateGift}
          />
        </TabsContent>

        {/* Briefs Tab - File Upload */}
        <TabsContent value="briefs" className="mt-6">
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
            <Card>
              <CardHeader>
                <CardTitle>Upload Brand Brief</CardTitle>
                <CardDescription>
                  Upload a brand brief document. We&apos;ll extract the key details and calculate your rate.
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
