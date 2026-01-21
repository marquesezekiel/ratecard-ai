"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Gift, DollarSign, AlertTriangle, CheckCircle, Copy, ArrowRight } from "lucide-react";
import type { CreatorProfile, DMAnalysis } from "@/lib/types";
import { toast } from "sonner";

interface DMParserFormProps {
  profile: CreatorProfile;
  onAnalysisComplete?: (analysis: DMAnalysis) => void;
  onEvaluateGift?: (analysis: DMAnalysis) => void;
}

/**
 * DM Parser Form Component
 *
 * Allows creators to paste brand DMs for instant analysis.
 * Detects gift offers, analyzes tone, and generates recommended responses.
 */
export function DMParserForm({ profile, onAnalysisComplete, onEvaluateGift }: DMParserFormProps) {
  const [dmText, setDmText] = useState("");
  const [analysis, setAnalysis] = useState<DMAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dmText.trim() || dmText.trim().length < 20) {
      setError("Please paste a DM message (at least 20 characters)");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/parse-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dmText: dmText.trim(), profile }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to analyze DM");
      }

      setAnalysis(result.data);
      onAnalysisComplete?.(result.data);
      toast.success("DM analyzed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (analysis?.recommendedResponse) {
      navigator.clipboard.writeText(analysis.recommendedResponse);
      toast.success("Response copied to clipboard");
    }
  };

  const handleEvaluateGift = () => {
    if (analysis && onEvaluateGift) {
      onEvaluateGift(analysis);
    }
  };

  const getCompensationBadge = (type: DMAnalysis["compensationType"]) => {
    switch (type) {
      case "paid":
        return <Badge className="bg-green-500 text-white"><DollarSign className="h-3 w-3 mr-1" /> Paid</Badge>;
      case "gifted":
        return <Badge className="bg-purple-500 text-white"><Gift className="h-3 w-3 mr-1" /> Gift</Badge>;
      case "hybrid":
        return <Badge className="bg-blue-500 text-white"><DollarSign className="h-3 w-3 mr-1" /> Hybrid</Badge>;
      case "unclear":
        return <Badge variant="secondary">Unclear</Badge>;
      case "none_mentioned":
        return <Badge variant="outline">Not Mentioned</Badge>;
    }
  };

  const getToneBadge = (tone: DMAnalysis["tone"]) => {
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

  const getDealQualityColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Analyze Brand DM
          </CardTitle>
          <CardDescription>
            Paste a brand DM below to get instant analysis, detect gift offers, and generate a professional response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dm-text">Brand Message</Label>
              <Textarea
                id="dm-text"
                placeholder="Paste the brand DM here..."
                value={dmText}
                onChange={(e) => setDmText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {dmText.length} characters
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading || dmText.trim().length < 20} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Analyze DM
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>
                    {analysis.brandName || "Unknown Brand"}
                  </CardTitle>
                  {analysis.brandHandle && (
                    <CardDescription>@{analysis.brandHandle}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  {getCompensationBadge(analysis.compensationType)}
                  {getToneBadge(analysis.tone)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deal Quality Score */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Deal Quality Estimate</span>
                <span className={`text-2xl font-bold ${getDealQualityColor(analysis.dealQualityEstimate)}`}>
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
                <span className="text-xl font-bold text-green-700">
                  ${analysis.suggestedRate}
                </span>
              </div>

              {/* Offered Amount (if paid) */}
              {analysis.offeredAmount && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">Their Offered Amount</span>
                  <span className="text-xl font-bold text-blue-700">
                    ${analysis.offeredAmount}
                  </span>
                </div>
              )}

              {/* Gift Value (if gift) */}
              {analysis.estimatedProductValue && analysis.isGiftOffer && (
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-sm font-medium text-purple-800">Estimated Product Value</span>
                  <span className="text-xl font-bold text-purple-700">
                    ${analysis.estimatedProductValue}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gift Analysis (if gift offer) */}
          {analysis.isGiftOffer && analysis.giftAnalysis && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Gift className="h-5 w-5" />
                  Gift Offer Detected
                </CardTitle>
                <CardDescription className="text-purple-700">
                  This is a gift/product-only offer. Here&apos;s our recommendation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.giftAnalysis.productMentioned && (
                  <div>
                    <Label className="text-sm text-purple-700">Product</Label>
                    <p className="mt-1 font-medium">{analysis.giftAnalysis.productMentioned}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-purple-700">Content Expected</Label>
                    <p className="mt-1 font-medium capitalize">{analysis.giftAnalysis.contentExpectation}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-purple-700">Conversion Potential</Label>
                    <p className="mt-1 font-medium capitalize">{analysis.giftAnalysis.conversionPotential}</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <Label className="text-sm text-purple-700">Recommended Approach</Label>
                  <p className="mt-1 font-semibold text-purple-900 capitalize">
                    {analysis.giftAnalysis.recommendedApproach.replace(/_/g, " ")}
                  </p>
                </div>

                {onEvaluateGift && (
                  <Button onClick={handleEvaluateGift} variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100">
                    <Gift className="h-4 w-4 mr-2" />
                    Evaluate This Gift
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
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
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                {analysis.recommendedResponse}
              </div>
              <Button onClick={handleCopyResponse} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Response
              </Button>
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
        </div>
      )}
    </div>
  );
}
