"use client";

import { useState, Suspense } from "react";
import { Shield, Info } from "lucide-react";
import { BrandVetterForm } from "@/components/forms/brand-vetter-form";
import { BrandVettingResult } from "@/components/brand-vetting-result";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Disclaimer */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle>Signals, Not Guarantees</AlertTitle>
        <AlertDescription>
          This tool analyzes publicly available signals but cannot guarantee
          brand legitimacy. Always do your own research before accepting deals.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold md:text-3xl">Brand Vetter</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Analyze trust signals before you engage. We&apos;ll research their social
          presence, website, and collaboration history to help you stay safe.
        </p>
      </header>

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
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display font-bold md:text-3xl">Brand Vetter</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">Loading...</p>
        </header>
      </div>
    }>
      <BrandVetterContent />
    </Suspense>
  );
}
