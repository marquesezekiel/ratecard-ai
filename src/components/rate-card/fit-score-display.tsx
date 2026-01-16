"use client";

import { FitScoreResult, FitLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FitScoreDisplayProps {
  fitScore: FitScoreResult;
}

const FIT_LEVEL_CONFIG: Record<
  FitLevel,
  { label: string; color: string; bgColor: string; ringColor: string }
> = {
  perfect: {
    label: "Perfect Fit",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    ringColor: "stroke-emerald-500",
  },
  high: {
    label: "High Fit",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    ringColor: "stroke-blue-500",
  },
  medium: {
    label: "Medium Fit",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    ringColor: "stroke-amber-500",
  },
  low: {
    label: "Low Fit",
    color: "text-red-700",
    bgColor: "bg-red-100",
    ringColor: "stroke-red-500",
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Brand Fit Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Score Display */}
        <div className="flex items-center gap-6">
          <div className="relative h-28 w-28 flex-shrink-0">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={config.ringColor}
              />
            </svg>
            {/* Score number in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{fitScore.totalScore}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Badge className={`${config.bgColor} ${config.color} hover:${config.bgColor}`}>
              {config.label}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Price adjustment:{" "}
              <span
                className={
                  isPositiveAdjustment ? "text-emerald-600 font-medium" : "text-red-600 font-medium"
                }
              >
                {isPositiveAdjustment ? "+" : ""}
                {priceAdjustmentPercent}%
              </span>
            </p>
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
          {Object.entries(fitScore.breakdown).map(([key, component]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{COMPONENT_LABELS[key]}</span>
                <span className="text-muted-foreground">
                  {component.score}/100 ({Math.round(component.weight * 100)}%)
                </span>
              </div>
              <Progress value={component.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{component.insight}</p>
            </div>
          ))}
        </div>

        {/* Top Insights */}
        {fitScore.insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Key Insights</h4>
            <ul className="space-y-1">
              {fitScore.insights.slice(0, 3).map((insight, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span className="text-emerald-500">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
