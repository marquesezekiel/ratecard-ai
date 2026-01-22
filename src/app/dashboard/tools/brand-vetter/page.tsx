"use client";

import { useState, Suspense } from "react";
import { Shield } from "lucide-react";
import { BrandVetterForm } from "@/components/forms/brand-vetter-form";
import { BrandVettingResult } from "@/components/brand-vetting-result";
import type { BrandVettingResult as BrandVettingResultType } from "@/lib/types";

function BrandVetterContent() {
  const [vettingResult, setVettingResult] = useState<BrandVettingResultType | null>(null);

  const handleVettingComplete = (result: BrandVettingResultType) => {
    setVettingResult(result);
  };

  const handleReset = () => {
    setVettingResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold md:text-3xl">Brand Vetter</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Check if a brand is legitimate before you engage. We&apos;ll research their social
          presence, website, and collaboration history to help you stay safe.
        </p>
      </div>

      {/* Form or Result */}
      {!vettingResult ? (
        <BrandVetterForm onVettingComplete={handleVettingComplete} />
      ) : (
        <BrandVettingResult result={vettingResult} onReset={handleReset} />
      )}
    </div>
  );
}

export default function BrandVetterPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold md:text-3xl">Brand Vetter</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">Loading...</p>
        </div>
      </div>
    }>
      <BrandVetterContent />
    </Suspense>
  );
}
