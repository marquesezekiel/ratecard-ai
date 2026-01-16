"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PricingResult } from "@/lib/types";

interface PricingBreakdownProps {
  pricing: PricingResult;
  showDetailedExplanation?: boolean;
}

function formatCurrency(amount: number, currencySymbol: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currencySymbol}${formatted}`;
}

function getAdjustmentIcon(adjustment: number) {
  if (adjustment > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (adjustment < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function getAdjustmentColor(adjustment: number) {
  if (adjustment > 0) return "text-green-600";
  if (adjustment < 0) return "text-red-600";
  return "text-gray-500";
}

// Explanations for each pricing layer
const LAYER_EXPLANATIONS: Record<string, string> = {
  "Base Rate": "Starting rate based on your follower tier. Nano (1K-10K): $100, Micro (10K-50K): $250, Mid (50K-500K): $750, Macro (500K+): $2,500.",
  "Engagement Multiplier": "Higher engagement means your audience actually pays attention. Brands pay more for engaged audiences.",
  "Format Premium": "Video content (Reels, TikToks) takes more effort than static posts. Complex formats command higher rates.",
  "Fit Score": "When your audience matches the brand's target customer, your content performs better—justifying a premium.",
  "Usage Rights": "If the brand wants to use your content in their ads, that's worth significantly more than organic posting only.",
  "Complexity Premium": "Productions requiring multiple locations, professional equipment, or extensive editing justify higher rates.",
};

export function PricingBreakdown({ pricing, showDetailedExplanation = true }: PricingBreakdownProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
          {showDetailedExplanation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-muted-foreground"
            >
              <Info className="h-4 w-4 mr-1" />
              {showExplanation ? "Hide" : "How we calculated this"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explanation Panel */}
        {showExplanation && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">How RateCard.AI Calculates Your Rate</h4>
            <p className="text-sm text-muted-foreground">
              We use a 6-layer pricing model based on industry benchmarks and real sponsorship data.
              Each factor either increases or decreases your base rate.
            </p>
            <p className="text-xs font-mono text-muted-foreground bg-background/50 p-2 rounded">
              Formula: (Base × Engagement) × (1+Format) × (1+Fit) × (1+Rights) × (1+Complexity)
            </p>
          </div>
        )}

        {/* 6-Layer Breakdown */}
        <div className="space-y-1">
          {pricing.layers.map((layer, index) => {
            const adjustmentPercent = Math.round(layer.adjustment * 100);
            const isExpanded = expandedLayer === layer.name;

            return (
              <div key={index}>
                <button
                  className="w-full py-3 flex items-center justify-between hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
                  onClick={() => setExpandedLayer(isExpanded ? null : layer.name)}
                >
                  <div className="flex items-center gap-2">
                    {getAdjustmentIcon(layer.adjustment)}
                    <span className="font-medium text-sm">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getAdjustmentColor(layer.adjustment)}`}>
                      {adjustmentPercent >= 0 ? "+" : ""}{adjustmentPercent}%
                    </span>
                    {showDetailedExplanation && (
                      isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded explanation */}
                {isExpanded && showDetailedExplanation && (
                  <div className="ml-6 pb-3 pr-2">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{layer.description}</p>
                      <p className="text-xs italic">
                        {LAYER_EXPLANATIONS[layer.name]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Per-Deliverable Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price per deliverable</span>
          <span className="font-medium">
            {formatCurrency(pricing.pricePerDeliverable, pricing.currencySymbol)}
          </span>
        </div>

        {pricing.quantity > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">×{pricing.quantity}</span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Your Rate</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(pricing.totalPrice, pricing.currencySymbol)}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{pricing.currency}</p>
              <p>Valid {pricing.validDays} days</p>
            </div>
          </div>
        </div>

        {/* Confidence note */}
        <p className="text-xs text-muted-foreground text-center">
          Based on industry benchmarks for creators in your tier with similar engagement.
          <br />
          Your actual rate may vary based on relationship with brand and negotiation.
        </p>
      </CardContent>
    </Card>
  );
}
