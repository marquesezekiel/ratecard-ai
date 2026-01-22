"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Gift,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Copy,
  ArrowRight,
  Target,
} from "lucide-react";
import type {
  CreatorProfile,
  GiftEvaluationInput,
  GiftEvaluation,
  GiftResponse,
  GiftBrandQuality,
  GiftContentRequired,
} from "@/lib/types";
import { toast } from "sonner";

interface GiftEvaluatorFormProps {
  profile: CreatorProfile;
  initialData?: Partial<GiftEvaluationInput>;
  onEvaluationComplete?: (evaluation: GiftEvaluation, response: GiftResponse) => void;
}

const CONTENT_OPTIONS: { value: GiftContentRequired; label: string; description: string }[] = [
  { value: "organic_mention", label: "Organic Mention", description: "Quick story or casual mention" },
  { value: "dedicated_post", label: "Dedicated Post", description: "Single feed post or reel" },
  { value: "multiple_posts", label: "Multiple Posts", description: "Several pieces of content" },
  { value: "video_content", label: "Video Content", description: "YouTube video or long-form content" },
];

const BRAND_QUALITY_OPTIONS: { value: GiftBrandQuality; label: string; description: string }[] = [
  { value: "major_brand", label: "Major Brand", description: "Recognizable name, verified presence" },
  { value: "established_indie", label: "Established Indie", description: "Smaller but legitimate brand" },
  { value: "new_unknown", label: "New/Unknown", description: "Can't verify, limited presence" },
  { value: "suspicious", label: "Suspicious", description: "Red flags, possibly fake" },
];

export function GiftEvaluatorForm({ profile, initialData, onEvaluationComplete }: GiftEvaluatorFormProps) {
  const [formData, setFormData] = useState<GiftEvaluationInput>({
    productDescription: initialData?.productDescription || "",
    estimatedProductValue: initialData?.estimatedProductValue || 0,
    contentRequired: initialData?.contentRequired || "dedicated_post",
    estimatedHoursToCreate: initialData?.estimatedHoursToCreate || 2,
    brandQuality: initialData?.brandQuality || "new_unknown",
    wouldYouBuyIt: initialData?.wouldYouBuyIt || false,
    brandFollowers: initialData?.brandFollowers || null,
    hasWebsite: initialData?.hasWebsite || false,
    previousCreatorCollabs: initialData?.previousCreatorCollabs || false,
  });

  const [evaluation, setEvaluation] = useState<GiftEvaluation | null>(null);
  const [response, setResponse] = useState<GiftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productDescription.trim()) {
      setError("Please describe the product");
      return;
    }

    if (formData.estimatedProductValue <= 0) {
      setError("Please enter the estimated product value");
      return;
    }

    setLoading(true);
    setError(null);
    setEvaluation(null);
    setResponse(null);

    try {
      const res = await fetch("/api/evaluate-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluation: formData, profile }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to evaluate gift");
      }

      setEvaluation(result.data.evaluation);
      setResponse(result.data.response);
      onEvaluationComplete?.(result.data.evaluation, result.data.response);
      toast.success("Gift evaluated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (response?.message) {
      navigator.clipboard.writeText(response.message);
      toast.success("Response copied to clipboard");
    }
  };

  const getRecommendationBadge = (rec: GiftEvaluation["recommendation"]) => {
    switch (rec) {
      case "accept_with_hook":
        return <Badge className="bg-green-500 text-white">Accept with Hook</Badge>;
      case "counter_hybrid":
        return <Badge className="bg-blue-500 text-white">Counter with Hybrid</Badge>;
      case "ask_budget_first":
        return <Badge className="bg-yellow-500 text-white">Ask About Budget</Badge>;
      case "decline_politely":
        return <Badge className="bg-orange-500 text-white">Decline Politely</Badge>;
      case "run_away":
        return <Badge className="bg-red-500 text-white">Walk Away</Badge>;
    }
  };

  const getWorthScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    if (score >= 30) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Evaluate Gift Offer
          </CardTitle>
          <CardDescription>
            Answer a few questions to determine if this gift is worth your time and what to ask for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product">What product are they offering?</Label>
                <Input
                  id="product"
                  placeholder="e.g., Skincare set, Fashion item..."
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Estimated retail value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  placeholder="e.g., 150"
                  value={formData.estimatedProductValue || ""}
                  onChange={(e) => setFormData({ ...formData, estimatedProductValue: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Content Required */}
            <div className="space-y-3">
              <Label>What content are they expecting?</Label>
              <RadioGroup
                value={formData.contentRequired}
                onValueChange={(value) => setFormData({ ...formData, contentRequired: value as GiftContentRequired })}
                className="grid gap-2 sm:grid-cols-2"
              >
                {CONTENT_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Time Estimate */}
            <div className="space-y-2">
              <Label htmlFor="hours">Estimated hours to create content</Label>
              <Select
                value={String(formData.estimatedHoursToCreate)}
                onValueChange={(value) => setFormData({ ...formData, estimatedHoursToCreate: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 minutes</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="5">5+ hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand Quality */}
            <div className="space-y-3">
              <Label>How would you rate this brand?</Label>
              <RadioGroup
                value={formData.brandQuality}
                onValueChange={(value) => setFormData({ ...formData, brandQuality: value as GiftBrandQuality })}
                className="grid gap-2 sm:grid-cols-2"
              >
                {BRAND_QUALITY_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={`brand-${option.value}`} className="mt-1" />
                    <Label htmlFor={`brand-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Additional Signals */}
            <div className="space-y-4">
              <Label>Additional information</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wouldBuy"
                    checked={formData.wouldYouBuyIt}
                    onCheckedChange={(checked) => setFormData({ ...formData, wouldYouBuyIt: !!checked })}
                  />
                  <Label htmlFor="wouldBuy" className="cursor-pointer">I would actually buy this product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasWebsite"
                    checked={formData.hasWebsite}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasWebsite: !!checked })}
                  />
                  <Label htmlFor="hasWebsite" className="cursor-pointer">Brand has a real website</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousCollabs"
                    checked={formData.previousCreatorCollabs}
                    onCheckedChange={(checked) => setFormData({ ...formData, previousCreatorCollabs: !!checked })}
                  />
                  <Label htmlFor="previousCollabs" className="cursor-pointer">Brand has worked with creators before</Label>
                </div>
              </div>
            </div>

            {/* Brand Followers (optional) */}
            <div className="space-y-2">
              <Label htmlFor="brandFollowers">Brand&apos;s follower count (optional)</Label>
              <Input
                id="brandFollowers"
                type="number"
                min="0"
                placeholder="e.g., 50000"
                value={formData.brandFollowers || ""}
                onChange={(e) => setFormData({ ...formData, brandFollowers: e.target.value ? Number(e.target.value) : null })}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Evaluate This Gift
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Evaluation Results */}
      {evaluation && response && (
        <div className="space-y-4">
          {/* Worth Score Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Gift Evaluation</CardTitle>
                  <CardDescription>Here&apos;s what we think about this offer</CardDescription>
                </div>
                {getRecommendationBadge(evaluation.recommendation)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Worth Score */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Worth Score</span>
                <span className={`text-3xl font-bold ${getWorthScoreColor(evaluation.worthScore)}`}>
                  {evaluation.worthScore}/100
                </span>
              </div>

              {/* Value Breakdown */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Gift className="h-4 w-4" />
                    You Receive
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${evaluation.analysis.productValue}
                  </div>
                  <div className="text-sm text-muted-foreground">Product value</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    You Provide
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${evaluation.analysis.totalValueProviding}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Time (${evaluation.analysis.yourTimeValue}) + Audience (${evaluation.analysis.audienceValue})
                  </div>
                </div>
              </div>

              {/* Value Gap */}
              <div className={`p-4 rounded-lg ${evaluation.analysis.valueGap >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${evaluation.analysis.valueGap >= 0 ? "text-green-800" : "text-red-800"}`}>
                    Value Gap
                  </span>
                  <span className={`text-xl font-bold ${evaluation.analysis.valueGap >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {evaluation.analysis.valueGap >= 0 ? "+" : ""}${evaluation.analysis.valueGap}
                  </span>
                </div>
                <p className="text-sm mt-1 text-muted-foreground">
                  {evaluation.analysis.valueGap >= 0
                    ? "The product value covers what you're providing"
                    : "You're giving more than you're receiving"}
                </p>
              </div>

              {/* Effective Hourly Rate */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Effective Hourly Rate
                </div>
                <div className="text-xl font-bold">
                  ${evaluation.analysis.effectiveHourlyRate}/hour
                </div>
              </div>

              {/* Minimum Add-On */}
              {evaluation.minimumAcceptableAddOn > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                    <DollarSign className="h-4 w-4" />
                    Minimum Counter
                  </div>
                  <div className="text-xl font-bold text-blue-700">
                    ${evaluation.minimumAcceptableAddOn}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Ask for at least this amount on top of the product
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategic Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Strategic Value ({evaluation.strategicValue.score}/10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  {evaluation.strategicValue.portfolioWorth ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Portfolio Worthy</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  {evaluation.strategicValue.brandReputationBoost ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Brand Reputation</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  <span className="text-sm">
                    Conversion: <strong className="capitalize">{evaluation.strategicValue.conversionPotential}</strong>
                  </span>
                </div>
              </div>
              {evaluation.strategicValue.reasons.length > 0 && (
                <ul className="space-y-1">
                  {evaluation.strategicValue.reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Walk Away Point */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                Walk Away Point
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700">{evaluation.walkAwayPoint}</p>
            </CardContent>
          </Card>

          {/* Recommended Response */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommended Response</CardTitle>
              <CardDescription>Copy and customize this message to send to the brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                {response.message}
              </div>
              <Button onClick={handleCopyResponse} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Response
              </Button>
            </CardContent>
          </Card>

          {/* Follow-up Reminder */}
          {response.followUpReminder && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                  <Clock className="h-4 w-4" />
                  Follow-up Reminder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">{response.followUpReminder}</p>
              </CardContent>
            </Card>
          )}

          {/* Conversion Script */}
          {response.conversionScript && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                  <ArrowRight className="h-4 w-4" />
                  Conversion Script
                </CardTitle>
                <CardDescription className="text-green-600">Use this later to convert to paid</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700 whitespace-pre-wrap">{response.conversionScript}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
