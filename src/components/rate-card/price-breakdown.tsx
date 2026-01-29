"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricingResult, PricingLayer } from "@/lib/types";

interface PriceBreakdownProps {
  pricing: PricingResult;
  className?: string;
}

/**
 * Collapsible price breakdown showing how the rate was calculated.
 * Helps creators understand and justify their pricing to brands.
 */
export function PriceBreakdown({ pricing, className }: PriceBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out layers with no impact (adjustment = 0 or multiplier = 1)
  const significantLayers = pricing.layers.filter(
    (layer) => layer.adjustment !== 0 || layer.multiplier !== 1
  );

  // Find base rate layer
  const baseRateLayer = pricing.layers.find(
    (layer) => layer.name === "Base Rate" || layer.name === "UGC Base Rate"
  );

  // All other layers that add/subtract from base
  const adjustmentLayers = significantLayers.filter(
    (layer) => layer.name !== "Base Rate" && layer.name !== "UGC Base Rate"
  );

  const formatAdjustment = (layer: PricingLayer): string => {
    const adjustment = Math.round(layer.adjustment);
    if (adjustment === 0) return "—";
    if (adjustment > 0) return `+$${adjustment.toLocaleString()}`;
    return `-$${Math.abs(adjustment).toLocaleString()}`;
  };

  const getAdjustmentColor = (layer: PricingLayer): string => {
    const adjustment = layer.adjustment;
    if (adjustment > 0) return "text-green-600";
    if (adjustment < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">How we calculated this</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t px-4 pb-4">
          {/* Base rate */}
          {baseRateLayer && (
            <div className="py-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{baseRateLayer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {baseRateLayer.description}
                  </p>
                </div>
                <span className="font-mono font-semibold">
                  ${Math.round(baseRateLayer.adjustment).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Adjustment layers */}
          <div className="divide-y">
            {adjustmentLayers.map((layer, index) => (
              <div key={index} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-sm">{layer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {layer.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-mono font-semibold text-sm whitespace-nowrap",
                      getAdjustmentColor(layer)
                    )}
                  >
                    {formatAdjustment(layer)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-3 mt-1 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {pricing.quantity > 1
                  ? `Per deliverable (×${pricing.quantity})`
                  : "Your Rate"}
              </span>
              <span className="font-mono font-bold text-lg">
                {pricing.currencySymbol}
                {pricing.pricePerDeliverable.toLocaleString()}
              </span>
            </div>
            {pricing.quantity > 1 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-mono font-bold text-xl text-primary">
                  {pricing.currencySymbol}
                  {pricing.totalPrice.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Tip */}
          <p className="text-xs text-muted-foreground mt-4 p-2 bg-muted/50 rounded">
            <strong>Pro tip:</strong> Use this breakdown to justify your rate when brands push back.
            Each factor reflects real market data.
          </p>
        </div>
      )}
    </div>
  );
}
