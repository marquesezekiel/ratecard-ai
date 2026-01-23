"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
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
  if (adjustment > 0) return <TrendingUp className="h-4 w-4" />;
  if (adjustment < 0) return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

function getAdjustmentStyles(adjustment: number) {
  if (adjustment > 0) return { text: "text-emerald-600", bg: "bg-emerald-50", icon: "text-emerald-500" };
  if (adjustment < 0) return { text: "text-red-600", bg: "bg-red-50", icon: "text-red-500" };
  return { text: "text-muted-foreground", bg: "bg-muted", icon: "text-muted-foreground" };
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Pricing Breakdown</CardTitle>
          </div>
          {showDetailedExplanation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="h-4 w-4 mr-1.5" />
              {showExplanation ? "Hide" : "How it works"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Explanation Panel */}
        {showExplanation && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-sm text-primary">How RateCard.AI Calculates Your Rate</h4>
            <p className="text-sm text-muted-foreground">
              We use a 6-layer pricing model based on industry benchmarks and real sponsorship data.
              Each factor either increases or decreases your base rate.
            </p>
            <code className="block text-xs text-muted-foreground bg-background/50 p-2.5 rounded-lg font-mono">
              (Base × Engagement) × (1+Format) × (1+Fit) × (1+Rights) × (1+Complexity)
            </code>
          </div>
        )}

        {/* 6-Layer Breakdown */}
        <div className="space-y-2">
          {pricing.layers.map((layer, index) => {
            const adjustmentPercent = Math.round(layer.adjustment * 100);
            const isExpanded = expandedLayer === layer.name;
            const styles = getAdjustmentStyles(layer.adjustment);

            return (
              <div key={index} className="rounded-xl border border-border/50 overflow-hidden transition-all duration-200 hover:border-border">
                <button
                  className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedLayer(isExpanded ? null : layer.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.bg}`}>
                      <span className={styles.icon}>{getAdjustmentIcon(layer.adjustment)}</span>
                    </div>
                    <span className="font-medium">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold px-2 py-1 rounded-md ${styles.bg} ${styles.text}`}>
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
                  <div className="px-4 pb-4 pt-0 bg-muted/20">
                    <div className="pl-11 space-y-1.5">
                      <p className="text-sm text-foreground">{layer.description}</p>
                      <p className="text-xs text-muted-foreground italic">
                        {LAYER_EXPLANATIONS[layer.name]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Price Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price per deliverable</span>
            <span className="font-semibold font-money">
              {formatCurrency(pricing.pricePerDeliverable, pricing.currencySymbol)}
            </span>
          </div>

          {pricing.quantity > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-semibold">×{pricing.quantity}</span>
            </div>
          )}
        </div>

        {/* Total - Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Your Rate</p>
              <p className="text-4xl font-bold tracking-tight mt-1">
                <AnimatedNumber
                  value={pricing.totalPrice}
                  prefix={pricing.currencySymbol}
                  duration={1200}
                  className="font-money"
                />
              </p>
            </div>
            <div className="text-right text-sm opacity-80">
              <p>{pricing.currency}</p>
              <p>Valid {pricing.validDays} days</p>
            </div>
          </div>
        </div>

        {/* Confidence note */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Based on industry benchmarks for creators in your tier with similar engagement.
          Your actual rate may vary based on your relationship with the brand.
        </p>
      </CardContent>
    </Card>
  );
}
