"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  MessageSquare,
  Mail,
  Gift,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Shield,
  FileText,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { DealBadgesRow } from "@/components/ui/deal-badges-row";
import { InlineGiftEvaluator } from "@/components/forms/inline-gift-evaluator";
import { trackEvent } from "@/lib/analytics";
import type { CreatorProfile, MessageAnalysis, MessageSource } from "@/lib/types";
import { toast } from "sonner";

interface MessageAnalyzerFormProps {
  profile: CreatorProfile;
  initialMessage?: string;
  onAnalysisComplete?: (analysis: MessageAnalysis) => void;
  onVetBrand?: (brandName: string, brandHandle?: string | null, platform?: string) => void;
  onReset?: () => void;
}

const SOURCE_OPTIONS: { value: MessageSource | "auto"; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "instagram_dm", label: "Instagram DM" },
  { value: "tiktok_dm", label: "TikTok DM" },
  { value: "twitter_dm", label: "Twitter/X DM" },
  { value: "linkedin_dm", label: "LinkedIn DM" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
];

/**
 * Brand Message Analyzer Form Component
 *
 * Unified analyzer for brand DMs and emails.
 * Detects gift offers, analyzes tone, and generates recommended responses.
 */
/**
 * Form instructions for screen readers
 */
const FORM_INSTRUCTIONS = "Fields marked with * are required.";

export function MessageAnalyzerForm({
  profile,
  initialMessage = "",
  onAnalysisComplete,
  onVetBrand,
  onReset,
}: MessageAnalyzerFormProps) {
  const router = useRouter();
  const [messageText, setMessageText] = useState(initialMessage);
  const [sourceHint, setSourceHint] = useState<MessageSource | "auto">("auto");
  const [analysis, setAnalysis] = useState<MessageAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [showGiftEvaluator, setShowGiftEvaluator] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || messageText.trim().length < 20) {
      setError("Please paste a message (at least 20 characters)");
      setStatusMessage("");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setStatusMessage("Analyzing your message...");

    try {
      const response = await fetch("/api/parse-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dmText: messageText.trim(),
          profile,
          sourceHint: sourceHint !== "auto" ? sourceHint : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to analyze message");
      }

      setAnalysis(result.data);
      setStatusMessage("Message analyzed successfully");
      onAnalysisComplete?.(result.data);

      // Track DM analysis
      trackEvent('dm_analyzed', {
        source: result.data.detectedSource,
        compensationType: result.data.compensationType,
        hasGiftOffer: result.data.isGiftOffer || false,
      });

      toast.success("Message analyzed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setStatusMessage("");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVetBrand = () => {
    if (analysis?.brandName) {
      if (onVetBrand) {
        onVetBrand(
          analysis.brandName,
          analysis.brandHandle,
          analysis.detectedSource?.replace("_dm", "") || "instagram"
        );
      } else {
        // Navigate to brand vetter with pre-filled params
        const params = new URLSearchParams();
        params.set("brand", analysis.brandName);
        if (analysis.brandHandle) params.set("handle", analysis.brandHandle);
        if (analysis.brandEmail) params.set("email", analysis.brandEmail);
        if (analysis.brandWebsite) params.set("website", analysis.brandWebsite);
        if (analysis.detectedSource) {
          params.set("platform", analysis.detectedSource.replace("_dm", ""));
        }
        router.push(`/dashboard/tools/brand-vetter?${params.toString()}`);
      }
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setMessageText("");
    setSourceHint("auto");
    setError(null);
    setStatusMessage("");
    setShowGiftEvaluator(false);
    onReset?.();
  };

  const getCompensationBadge = (type: MessageAnalysis["compensationType"]) => {
    switch (type) {
      case "paid":
        return (
          <Badge className="bg-green-500 text-white">
            <DollarSign className="h-3 w-3 mr-1" /> Paid
          </Badge>
        );
      case "gifted":
        return (
          <Badge className="bg-purple-500 text-white">
            <Gift className="h-3 w-3 mr-1" /> Gift
          </Badge>
        );
      case "hybrid":
        return (
          <Badge className="bg-blue-500 text-white">
            <DollarSign className="h-3 w-3 mr-1" /> Hybrid
          </Badge>
        );
      case "unclear":
        return <Badge variant="secondary">Unclear</Badge>;
      case "none_mentioned":
        return <Badge variant="outline">Not Mentioned</Badge>;
    }
  };

  const getToneBadge = (tone: MessageAnalysis["tone"]) => {
    switch (tone) {
      case "professional":
        return <Badge className="bg-blue-100 text-blue-800">Professional</Badge>;
      case "casual":
        return <Badge className="bg-gray-100 text-gray-800">Casual</Badge>;
      case "mass_outreach":
        return <Badge className="bg-yellow-100 text-yellow-800">Mass Outreach</Badge>;
      case "scam_likely":
        return <Badge className="bg-red-100 text-red-800">Suspicious</Badge>;
    }
  };

  const getSourceBadge = (source: MessageSource) => {
    const sourceLabels: Record<MessageSource, string> = {
      instagram_dm: "Instagram DM",
      tiktok_dm: "TikTok DM",
      twitter_dm: "Twitter DM",
      linkedin_dm: "LinkedIn DM",
      email: "Email",
      other: "Other",
    };

    const isEmail = source === "email";
    return (
      <Badge variant="outline" className={isEmail ? "border-blue-300 text-blue-700" : ""}>
        {isEmail ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
        {sourceLabels[source]}
      </Badge>
    );
  };

  const getDealQualityColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Get personalized headline based on analysis results
  const getResultHeadline = (analysis: MessageAnalysis) => {
    if (analysis.tone === "scam_likely") {
      return {
        emoji: "🚩",
        headline: "This Looks Suspicious",
        subline: "We detected some red flags you should know about",
      };
    }
    if (analysis.compensationType === "gifted" || analysis.isGiftOffer) {
      return {
        emoji: "🎁",
        headline: "Gift Offer Detected",
        subline: "They want to send free product in exchange for content",
      };
    }
    if (analysis.compensationType === "paid") {
      return {
        emoji: "💰",
        headline: "Paid Opportunity!",
        subline: analysis.offeredAmount
          ? `They mentioned $${analysis.offeredAmount}`
          : "They're offering payment for your work",
      };
    }
    if (analysis.compensationType === "hybrid") {
      return {
        emoji: "💎",
        headline: "Hybrid Deal",
        subline: "Product + payment combo — could be a good deal",
      };
    }
    if (analysis.tone === "mass_outreach") {
      return {
        emoji: "📋",
        headline: "Mass Outreach Template",
        subline: "This message was probably sent to many creators",
      };
    }
    return {
      emoji: "📬",
      headline: "Message Analyzed",
      subline: "Here's what we found",
    };
  };

  // Show only results when analysis is complete (fullscreen takeover)
  if (analysis) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-4">
          {/* Personality Header */}
          {(() => {
            const { emoji, headline, subline } = getResultHeadline(analysis);
            return (
              <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-5xl mb-3">{emoji}</div>
                <h2 className="text-2xl font-display font-bold">{headline}</h2>
                <p className="text-muted-foreground mt-1">{subline}</p>
              </div>
            );
          })()}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 justify-center">
            {analysis.isGiftOffer && !showGiftEvaluator && (
              <Button variant="outline" size="sm" onClick={() => setShowGiftEvaluator(true)}>
                <Gift className="h-4 w-4 mr-2" />
                Evaluate This Gift
              </Button>
            )}

            {analysis.brandName && (
              <Button variant="outline" size="sm" onClick={handleVetBrand}>
                <Shield className="h-4 w-4 mr-2" />
                Vet This Brand
              </Button>
            )}

            {analysis.compensationType === "paid" && (
              <Button size="sm" asChild>
                <Link href="/quick-calculate">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Rate Card
                </Link>
              </Button>
            )}
          </div>

          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>{analysis.brandName || "Unknown Brand"}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {analysis.brandHandle && (
                      <CardDescription className="text-sm">@{analysis.brandHandle}</CardDescription>
                    )}
                    {analysis.brandEmail && (
                      <CardDescription className="text-sm">{analysis.brandEmail}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getSourceBadge(analysis.detectedSource)}
                  {getCompensationBadge(analysis.compensationType)}
                  {getToneBadge(analysis.tone)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visual Deal Quality Badges */}
              <DealBadgesRow
                dealQualityScore={analysis.dealQualityEstimate}
                isGiftOffer={analysis.isGiftOffer || analysis.compensationType === "gifted"}
                hasDeadline={analysis.urgency === "high"}
                hasRedFlags={analysis.tone === "scam_likely" || analysis.redFlags.length > 0}
              />

              {/* Email Metadata (if email) */}
              {analysis.emailMetadata && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <Mail className="h-4 w-4" />
                    Email Details
                  </div>
                  {analysis.emailMetadata.subject && (
                    <div className="text-sm">
                      <span className="text-blue-700 font-medium">Subject:</span> {analysis.emailMetadata.subject}
                    </div>
                  )}
                  {analysis.emailMetadata.senderName && (
                    <div className="text-sm">
                      <span className="text-blue-700 font-medium">From:</span> {analysis.emailMetadata.senderName}
                      {analysis.emailMetadata.senderEmail && ` <${analysis.emailMetadata.senderEmail}>`}
                    </div>
                  )}
                </div>
              )}

              {/* Deal Quality Score */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Deal Quality Estimate</span>
                <span className={`text-2xl font-bold font-money ${getDealQualityColor(analysis.dealQualityEstimate)}`}>
                  {analysis.dealQualityEstimate}/100
                </span>
              </div>

              {/* Request Summary */}
              {analysis.deliverableRequest && (
                <div>
                  <Label className="text-sm text-muted-foreground">What they&apos;re asking for</Label>
                  <p className="mt-1">{analysis.deliverableRequest}</p>
                </div>
              )}

              {/* Suggested Rate */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm font-medium text-green-800">
                  {analysis.isGiftOffer ? "Suggested Hybrid Counter" : "Your Rate"}
                </span>
                <span className="text-xl font-bold font-money text-green-700">${analysis.suggestedRate}</span>
              </div>

              {/* Offered Amount (if paid) */}
              {analysis.offeredAmount && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">Their Offered Amount</span>
                  <span className="text-xl font-bold font-money text-blue-700">${analysis.offeredAmount}</span>
                </div>
              )}

              {/* Gift Value (if gift) */}
              {analysis.estimatedProductValue && analysis.isGiftOffer && (
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-sm font-medium text-purple-800">Estimated Product Value</span>
                  <span className="text-xl font-bold font-money text-purple-700">${analysis.estimatedProductValue}</span>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Gift Evaluation (inline) */}
          {analysis.isGiftOffer && showGiftEvaluator && (
            <InlineGiftEvaluator
              profile={profile}
              analysis={analysis}
              onClose={() => setShowGiftEvaluator(false)}
            />
          )}

          {/* Gift Analysis Summary (if gift offer and evaluator not shown) */}
          {analysis.isGiftOffer && analysis.giftAnalysis && !showGiftEvaluator && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Gift className="h-5 w-5" />
                    Gift Offer Detected
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGiftEvaluator(true)}
                    className="text-purple-700 border-purple-300 hover:bg-purple-100"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Calculate Worth
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {analysis.giftAnalysis.productMentioned && (
                    <div>
                      <span className="text-purple-700">Product:</span>
                      <p className="font-medium">{analysis.giftAnalysis.productMentioned}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-purple-700">Content:</span>
                    <p className="font-medium capitalize">{analysis.giftAnalysis.contentExpectation}</p>
                  </div>
                  <div>
                    <span className="text-purple-700">Conversion:</span>
                    <p className="font-medium capitalize">{analysis.giftAnalysis.conversionPotential}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Red Flags */}
            {analysis.redFlags.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Red Flags ({analysis.redFlags.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysis.redFlags.map((flag, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Green Flags */}
            {analysis.greenFlags.length > 0 && (
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Green Flags ({analysis.greenFlags.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysis.greenFlags.map((flag, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommended Response */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommended Response</CardTitle>
              <CardDescription>Copy and customize this message to send to the brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">{analysis.recommendedResponse}</div>
              <CopyButton
                text={analysis.recommendedResponse}
                label="Copy Response"
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Next Steps */}
          {analysis.nextSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {analysis.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Start Over Button */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Analyze Another Message
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: show input form
  return (
    <div className="space-y-6">
      <Card
        className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors"
        data-tour="message-input"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Drop your message here
          </CardTitle>
          <CardDescription>
            Paste a DM, email, or any brand outreach. We&apos;ll decode it for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="message-form-instructions">
            <p id="message-form-instructions" className="sr-only">{FORM_INSTRUCTIONS}</p>
            <p className="text-xs text-muted-foreground" aria-hidden="true">{FORM_INSTRUCTIONS}</p>

            <div className="space-y-2">
              <Label htmlFor="source-hint">Message Source (optional)</Label>
              <Select value={sourceHint} onValueChange={(v) => setSourceHint(v as MessageSource | "auto")}>
                <SelectTrigger id="source-hint">
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                We&apos;ll auto-detect if this is a DM or email, but you can specify if you know.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-text" required>Brand Message</Label>
              <Textarea
                id="message-text"
                placeholder={`Paste a brand message here...

Example DM:
"Hey! We love your content and would love to send you some products to try!"

Example Email:
"Dear Creator, We're reaching out about a paid partnership opportunity..."`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[200px] resize-none text-base leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> DMs
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Emails
                  </span>
                </div>
                <span>{messageText.length} characters</span>
              </div>
            </div>

            <div role="status" aria-live="polite" className="sr-only">
              {statusMessage}
            </div>

            <div role="alert" aria-live="assertive">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}
            </div>

            <Button type="submit" disabled={loading || messageText.trim().length < 20} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Analyze Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Backwards compatibility export
export { MessageAnalyzerForm as DMParserForm };
