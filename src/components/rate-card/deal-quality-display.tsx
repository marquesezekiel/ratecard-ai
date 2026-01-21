"use client";

import { DealQualityResult, DealQualityLevel, DealRecommendation, FitScoreResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FitScoreDisplay } from "./fit-score-display";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Handshake,
} from "lucide-react";

interface DealQualityDisplayProps {
  dealQuality: DealQualityResult;
}

const QUALITY_LEVEL_CONFIG: Record<
  DealQualityLevel,
  { label: string; color: string; bgColor: string; ringColor: string; gradient: string; icon: typeof Sparkles }
> = {
  excellent: {
    label: "Excellent Opportunity",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    ringColor: "stroke-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
    icon: Sparkles,
  },
  good: {
    label: "Good Deal",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    ringColor: "stroke-blue-500",
    gradient: "from-blue-500 to-blue-600",
    icon: ThumbsUp,
  },
  fair: {
    label: "Fair - Negotiate",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    ringColor: "stroke-amber-500",
    gradient: "from-amber-500 to-amber-600",
    icon: Handshake,
  },
  caution: {
    label: "Proceed with Caution",
    color: "text-red-700",
    bgColor: "bg-red-100",
    ringColor: "stroke-red-500",
    gradient: "from-red-500 to-red-600",
    icon: AlertTriangle,
  },
};

const RECOMMENDATION_CONFIG: Record<
  DealRecommendation,
  { icon: typeof CheckCircle2; color: string; bgColor: string }
> = {
  take_deal: { icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  good_deal: { icon: ThumbsUp, color: "text-blue-600", bgColor: "bg-blue-50" },
  negotiate: { icon: Handshake, color: "text-amber-600", bgColor: "bg-amber-50" },
  decline: { icon: ThumbsDown, color: "text-red-600", bgColor: "bg-red-50" },
  ask_questions: { icon: HelpCircle, color: "text-purple-600", bgColor: "bg-purple-50" },
};

const COMPONENT_LABELS: Record<string, string> = {
  rateFairness: "Rate Fairness",
  brandLegitimacy: "Brand Legitimacy",
  portfolioValue: "Portfolio Value",
  growthPotential: "Growth Potential",
  termsFairness: "Terms Fairness",
  creativeFreedom: "Creative Freedom",
};

export function DealQualityDisplay({ dealQuality }: DealQualityDisplayProps) {
  const config = QUALITY_LEVEL_CONFIG[dealQuality.qualityLevel];
  const recommendationConfig = RECOMMENDATION_CONFIG[dealQuality.recommendation];
  const priceAdjustmentPercent = Math.round(dealQuality.priceAdjustment * 100);
  const isPositiveAdjustment = priceAdjustmentPercent >= 0;

  // Calculate circumference for the circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (dealQuality.totalScore / 100) * circumference;
  const offset = circumference - progress;

  const IconComponent = config.icon;
  const RecommendationIcon = recommendationConfig.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Deal Quality Score</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Score Display */}
        <div className="flex items-center gap-6">
          <div className="relative h-32 w-32 flex-shrink-0">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`${config.ringColor} transition-all duration-700 ease-out`}
              />
            </svg>
            {/* Score number in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tracking-tight">{dealQuality.totalScore}</span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>

          <div className="space-y-3">
            <Badge className={`${config.bgColor} ${config.color} hover:${config.bgColor} text-sm px-3 py-1`}>
              <IconComponent className="h-3.5 w-3.5 mr-1.5" />
              {config.label}
            </Badge>
            <div className="flex items-center gap-2">
              {isPositiveAdjustment ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                Rate adjustment:{" "}
                <span className={`font-semibold ${isPositiveAdjustment ? "text-emerald-600" : "text-red-600"}`}>
                  {isPositiveAdjustment ? "+" : ""}{priceAdjustmentPercent}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-lg p-4 ${recommendationConfig.bgColor}`}>
          <div className="flex items-start gap-3">
            <RecommendationIcon className={`h-5 w-5 mt-0.5 ${recommendationConfig.color}`} />
            <div>
              <p className={`font-medium ${recommendationConfig.color}`}>Recommendation</p>
              <p className="text-sm text-muted-foreground mt-1">{dealQuality.recommendationText}</p>
            </div>
          </div>
        </div>

        {/* Red Flags & Green Flags */}
        {(dealQuality.redFlags.length > 0 || dealQuality.greenFlags.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {dealQuality.greenFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Green Flags
                </h4>
                <ul className="space-y-1">
                  {dealQuality.greenFlags.slice(0, 3).map((flag, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">+</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dealQuality.redFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Red Flags
                </h4>
                <ul className="space-y-1">
                  {dealQuality.redFlags.slice(0, 3).map((flag, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-red-500 mt-0.5">!</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Component Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</h4>
          <div className="space-y-4">
            {Object.entries(dealQuality.breakdown).map(([key, component]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{COMPONENT_LABELS[key] || component.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {component.score}/{component.maxPoints}
                    <span className="text-xs ml-1">({Math.round(component.weight * 100)}%)</span>
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={(component.score / component.maxPoints) * 100}
                    className="h-2.5"
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{component.insight}</p>
                {component.tips && component.tips.length > 0 && (
                  <ul className="text-xs text-amber-600 space-y-0.5">
                    {component.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <span className="mt-0.5">-</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Insights */}
        {dealQuality.insights.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Insights</h4>
            <ul className="space-y-2">
              {dealQuality.insights.slice(0, 3).map((insight, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper component that accepts either DealQualityResult or FitScoreResult.
 * Displays the appropriate UI based on the score type.
 */
interface ScoreDisplayProps {
  score: DealQualityResult | FitScoreResult;
}

/**
 * Type guard to check if the score is a DealQualityResult.
 */
function isDealQualityResult(score: DealQualityResult | FitScoreResult): score is DealQualityResult {
  return "qualityLevel" in score && "recommendation" in score;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  if (isDealQualityResult(score)) {
    return <DealQualityDisplay dealQuality={score} />;
  }

  // For FitScoreResult, use the legacy FitScoreDisplay component
  return <FitScoreDisplay fitScore={score} />;
}
