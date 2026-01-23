"use client";

import { FitScoreResult, FitLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface FitScoreDisplayProps {
  fitScore: FitScoreResult;
}

const FIT_LEVEL_CONFIG: Record<
  FitLevel,
  { label: string; color: string; bgColor: string; ringColor: string; gradient: string }
> = {
  perfect: {
    label: "Perfect Fit",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    ringColor: "stroke-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  high: {
    label: "High Fit",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    ringColor: "stroke-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  medium: {
    label: "Medium Fit",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    ringColor: "stroke-amber-500",
    gradient: "from-amber-500 to-amber-600",
  },
  low: {
    label: "Low Fit",
    color: "text-red-700",
    bgColor: "bg-red-100",
    ringColor: "stroke-red-500",
    gradient: "from-red-500 to-red-600",
  },
};

const COMPONENT_LABELS: Record<string, string> = {
  nicheMatch: "Niche Match",
  demographicMatch: "Demographics",
  platformMatch: "Platform",
  engagementQuality: "Engagement",
  contentCapability: "Content",
};

export function FitScoreDisplay({ fitScore }: FitScoreDisplayProps) {
  const config = FIT_LEVEL_CONFIG[fitScore.fitLevel];
  const priceAdjustmentPercent = Math.round(fitScore.priceAdjustment * 100);
  const isPositiveAdjustment = priceAdjustmentPercent >= 0;

  // Calculate circumference for the circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (fitScore.totalScore / 100) * circumference;
  const offset = circumference - progress;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Brand Fit Score</CardTitle>
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
              <span className="text-4xl font-bold font-money tracking-tight">{fitScore.totalScore}</span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>

          <div className="space-y-3">
            <Badge className={`${config.bgColor} ${config.color} hover:${config.bgColor} text-sm px-3 py-1`}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {config.label}
            </Badge>
            <div className="flex items-center gap-2">
              {isPositiveAdjustment ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                Price adjustment:{" "}
                <span className={`font-semibold ${isPositiveAdjustment ? "text-emerald-600" : "text-red-600"}`}>
                  {isPositiveAdjustment ? "+" : ""}{priceAdjustmentPercent}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</h4>
          <div className="space-y-4">
            {Object.entries(fitScore.breakdown).map(([key, component]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{COMPONENT_LABELS[key]}</span>
                  <span className="text-sm text-muted-foreground">
                    {component.score}/100
                    <span className="text-xs ml-1">({Math.round(component.weight * 100)}%)</span>
                  </span>
                </div>
                <div className="relative">
                  <Progress value={component.score} className="h-2.5" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{component.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Insights */}
        {fitScore.insights.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Insights</h4>
            <ul className="space-y-2">
              {fitScore.insights.slice(0, 3).map((insight, index) => (
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
