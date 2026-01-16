"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calculator, Edit2 } from "lucide-react";
import type { PricingResult } from "@/lib/types";

interface PriceAdjusterProps {
  calculatedPricing: PricingResult;
  onPriceChange: (adjustedPricing: PricingResult) => void;
}

export function PriceAdjuster({ calculatedPricing, onPriceChange }: PriceAdjusterProps) {
  const [useCalculated, setUseCalculated] = useState(true);
  const [customPrice, setCustomPrice] = useState(calculatedPricing.totalPrice);

  const difference = customPrice - calculatedPricing.totalPrice;
  const percentDiff = ((difference / calculatedPricing.totalPrice) * 100).toFixed(0);

  useEffect(() => {
    if (useCalculated) {
      onPriceChange(calculatedPricing);
    } else {
      onPriceChange({
        ...calculatedPricing,
        pricePerDeliverable: Math.round(customPrice / calculatedPricing.quantity),
        totalPrice: customPrice,
        originalTotal: calculatedPricing.totalPrice,
      });
    }
  }, [useCalculated, customPrice, calculatedPricing, onPriceChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Your Final Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={useCalculated ? "calculated" : "custom"}
          onValueChange={(val) => setUseCalculated(val === "calculated")}
        >
          {/* Option 1: Use Calculated */}
          <div
            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer ${
              useCalculated ? "border-primary bg-primary/5" : "border-gray-200"
            }`}
            onClick={() => setUseCalculated(true)}
          >
            <RadioGroupItem value="calculated" id="calculated" className="mt-1" />
            <div className="flex-1">
              <label htmlFor="calculated" className="font-medium cursor-pointer">
                Use RateCard.AI suggestion
              </label>
              <p className="text-2xl font-bold mt-1">
                {calculatedPricing.currencySymbol || "$"}
                {calculatedPricing.totalPrice.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Based on your metrics and campaign requirements
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Recommended
            </Badge>
          </div>

          {/* Option 2: Custom Price */}
          <div
            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer mt-3 ${
              !useCalculated ? "border-primary bg-primary/5" : "border-gray-200"
            }`}
            onClick={() => setUseCalculated(false)}
          >
            <RadioGroupItem value="custom" id="custom" className="mt-1" />
            <div className="flex-1">
              <label htmlFor="custom" className="font-medium cursor-pointer flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Set my own price
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {calculatedPricing.currencySymbol || "$"}
                </span>
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                  disabled={useCalculated}
                  className="w-32 text-lg font-bold"
                  min={0}
                  step={50}
                  onClick={(e) => e.stopPropagation()}
                />
                {!useCalculated && difference !== 0 && (
                  <span className={`text-sm font-medium ${difference > 0 ? "text-green-600" : "text-red-600"}`}>
                    {difference > 0 ? "+" : ""}{percentDiff}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </RadioGroup>

        {!useCalculated && (
          <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
            {difference < 0
              ? "Going lower is okay for your first deal—just don't undervalue yourself long-term."
              : "Your custom rate will appear on the PDF with the suggested rate for reference."
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
