"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Gift,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import type { CreatorProfile, MessageAnalysis, GiftEvaluation, GiftEvaluationInput, GiftBrandQuality, GiftContentRequired } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InlineGiftEvaluatorProps {
  profile: CreatorProfile;
  analysis: MessageAnalysis;
  onClose?: () => void;
}

const CONTENT_OPTIONS: { value: GiftContentRequired; label: string; description: string }[] = [
  { value: "organic_mention", label: "Quick Mention", description: "Story or casual mention" },
  { value: "dedicated_post", label: "Dedicated Post", description: "Feed post or reel" },
  { value: "multiple_posts", label: "Multiple Posts", description: "Several pieces" },
  { value: "video_content", label: "Video Content", description: "YouTube or long-form" },
];

const BRAND_QUALITY_OPTIONS: { value: GiftBrandQuality; label: string }[] = [
  { value: "major_brand", label: "Major Brand" },
  { value: "established_indie", label: "Established Indie" },
  { value: "new_unknown", label: "New/Unknown" },
  { value: "suspicious", label: "Suspicious" },
];

const HOURS_OPTIONS = [
  { value: "0.5", label: "30 min" },
  { value: "1", label: "1 hour" },
  { value: "2", label: "2 hours" },
  { value: "3", label: "3 hours" },
  { value: "4", label: "4+ hours" },
];

/**
 * Map content expectation from DM analysis to gift evaluator input
 */
function mapContentExpectation(expectation?: string): GiftContentRequired {
  switch (expectation) {
    case "explicit":
    case "implied":
      return "dedicated_post";
    case "none":
      return "organic_mention";
    default:
      return "dedicated_post";
  }
}

/**
 * Infer brand quality from tone and flags
 */
function inferBrandQuality(analysis: MessageAnalysis): GiftBrandQuality {
  if (analysis.tone === "scam_likely") return "suspicious";
  if (analysis.tone === "professional" && analysis.greenFlags.length >= 2) return "established_indie";
  if (analysis.redFlags.length >= 2) return "suspicious";
  return "new_unknown";
}

export function InlineGiftEvaluator({ profile, analysis, onClose }: InlineGiftEvaluatorProps) {
  // Pre-populate from analysis
  const [productValue, setProductValue] = useState<string>(
    analysis.estimatedProductValue?.toString() || ""
  );
  const [hours, setHours] = useState<string>("2");
  const [contentRequired, setContentRequired] = useState<GiftContentRequired>(
    mapContentExpectation(analysis.giftAnalysis?.contentExpectation)
  );
  const [brandQuality, setBrandQuality] = useState<GiftBrandQuality>(
    inferBrandQuality(analysis)
  );
  const [wouldBuy, setWouldBuy] = useState(false);
  const [hasWebsite, setHasWebsite] = useState(!!analysis.brandWebsite);
  const [previousCollabs, setPreviousCollabs] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<GiftEvaluation | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleEvaluate = async () => {
    const value = parseFloat(productValue);
    if (!value || value <= 0) {
      toast.error("Please enter the product value");
      return;
    }

    setIsLoading(true);

    try {
      const input: GiftEvaluationInput = {
        productDescription: analysis.giftAnalysis?.productMentioned || analysis.brandName || "Product",
        estimatedProductValue: value,
        contentRequired,
        estimatedHoursToCreate: parseFloat(hours),
        brandQuality,
        wouldYouBuyIt: wouldBuy,
        hasWebsite,
        previousCreatorCollabs: previousCollabs,
        brandFollowers: null,
      };

      const response = await fetch("/api/evaluate-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluation: input, profile }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to evaluate gift");
      }

      // API returns { evaluation, response } - we just need the evaluation
      setEvaluation(result.data.evaluation);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to evaluate gift");
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationDisplay = (rec: GiftEvaluation["recommendation"]) => {
    switch (rec) {
      case "accept_with_hook":
        return {
          label: "Accept It",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          description: "Good deal! Accept and plant seeds for paid work.",
        };
      case "counter_hybrid":
        return {
          label: "Counter",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: TrendingUp,
          description: "Counter with a hybrid offer (product + payment).",
        };
      case "ask_budget_first":
        return {
          label: "Ask Budget",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: DollarSign,
          description: "Ask if they have budget before committing.",
        };
      case "decline_politely":
        return {
          label: "Decline",
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: XCircle,
          description: "Not worth your time. Politely pass.",
        };
      case "run_away":
        return {
          label: "Avoid",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: AlertTriangle,
          description: "Red flags detected. Do not engage.",
        };
    }
  };

  // Show results if evaluation is complete
  if (evaluation) {
    const rec = getRecommendationDisplay(evaluation.recommendation);
    const RecIcon = rec.icon;

    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Gift className="h-5 w-5" />
              Gift Evaluation
            </CardTitle>
            <Badge className={cn("text-sm", rec.color)}>
              <RecIcon className="h-3 w-3 mr-1" />
              {rec.label}
            </Badge>
          </div>
          <CardDescription>{rec.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Worth Score */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium">Worth Score</span>
            <span className={cn(
              "text-2xl font-bold font-mono",
              evaluation.worthScore >= 70 ? "text-green-600" :
              evaluation.worthScore >= 50 ? "text-yellow-600" : "text-red-600"
            )}>
              {evaluation.worthScore}/100
            </span>
          </div>

          {/* Value Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-muted-foreground">Product Value</div>
              <div className="font-mono font-semibold">${evaluation.analysis.productValue}</div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-muted-foreground">Your Time Value</div>
              <div className="font-mono font-semibold">${evaluation.analysis.yourTimeValue}</div>
            </div>
          </div>

          {/* Value Gap */}
          <div className={cn(
            "p-3 rounded-lg border",
            evaluation.analysis.valueGap >= 0
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {evaluation.analysis.valueGap >= 0 ? "You're getting a fair deal" : "Gap to cover"}
              </span>
              <span className={cn(
                "font-mono font-semibold",
                evaluation.analysis.valueGap >= 0 ? "text-green-700" : "text-red-700"
              )}>
                {evaluation.analysis.valueGap >= 0 ? "+" : ""}${evaluation.analysis.valueGap}
              </span>
            </div>
          </div>

          {/* Minimum Add-on (if needed) */}
          {evaluation.minimumAcceptableAddOn > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800">Minimum Add-on Needed</div>
              <div className="font-mono font-bold text-blue-700 text-lg">
                ${evaluation.minimumAcceptableAddOn}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Ask for this amount on top of the gift to make it fair.
              </p>
            </div>
          )}

          {/* Counter Offer */}
          {evaluation.recommendation !== "run_away" && evaluation.recommendation !== "accept_with_hook" && (
            <div className="space-y-2">
              <Label className="text-sm">Suggested Response</Label>
              <div className="p-3 bg-white rounded-lg border text-sm whitespace-pre-wrap">
                {evaluation.suggestedCounterOffer}
              </div>
              <CopyButton
                text={evaluation.suggestedCounterOffer}
                label="Copy Response"
                className="w-full"
              />
            </div>
          )}

          {/* Walk Away Point */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground font-medium mb-1">Walk-Away Point</div>
            <p className="text-sm">{evaluation.walkAwayPoint}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEvaluation(null)}
              className="flex-1"
            >
              Re-evaluate
            </Button>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show input form
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Gift className="h-5 w-5" />
          Evaluate This Gift
        </CardTitle>
        <CardDescription>
          Answer a few quick questions to see if this gift is worth your time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product mentioned */}
        {analysis.giftAnalysis?.productMentioned && (
          <div className="p-2 bg-white rounded border text-sm">
            <span className="text-muted-foreground">Product: </span>
            <span className="font-medium">{analysis.giftAnalysis.productMentioned}</span>
          </div>
        )}

        {/* Essential fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="product-value" className="text-xs">Product Value ($)</Label>
            <Input
              id="product-value"
              type="number"
              placeholder="e.g., 50"
              value={productValue}
              onChange={(e) => setProductValue(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hours" className="text-xs">Time to Create</Label>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger id="hours" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Content Expected</Label>
          <div className="grid grid-cols-2 gap-2">
            {CONTENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentRequired(opt.value)}
                className={cn(
                  "p-2 text-left rounded-lg border text-sm transition-colors",
                  contentRequired === opt.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                )}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="would-buy"
            checked={wouldBuy}
            onCheckedChange={(checked) => setWouldBuy(checked === true)}
          />
          <Label htmlFor="would-buy" className="text-sm cursor-pointer">
            I&apos;d actually buy this product
          </Label>
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showAdvanced ? "Hide" : "More"} options
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Brand Quality</Label>
              <Select value={brandQuality} onValueChange={(v) => setBrandQuality(v as GiftBrandQuality)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_QUALITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has-website"
                  checked={hasWebsite}
                  onCheckedChange={(checked) => setHasWebsite(checked === true)}
                />
                <Label htmlFor="has-website" className="text-sm cursor-pointer">
                  Brand has a real website
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="previous-collabs"
                  checked={previousCollabs}
                  onCheckedChange={(checked) => setPreviousCollabs(checked === true)}
                />
                <Label htmlFor="previous-collabs" className="text-sm cursor-pointer">
                  Brand has worked with creators before
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Evaluate button */}
        <Button
          onClick={handleEvaluate}
          disabled={isLoading || !productValue}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 mr-2" />
              Evaluate Gift
            </>
          )}
        </Button>

        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
