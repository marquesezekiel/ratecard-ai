"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calculator, CheckCircle2 } from "lucide-react";
import { QuickCalculatorForm } from "@/components/forms/quick-calculator-form";
import { QuickCalculatorResult } from "@/components/quick-calculator-result";
import type { QuickEstimateResult } from "@/lib/types";

export default function QuickCalculatePage() {
  const [result, setResult] = useState<QuickEstimateResult | null>(null);

  const handleResult = (estimate: QuickEstimateResult) => {
    setResult(estimate);
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">RateCard.AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Sign up free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {!result ? (
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
            {/* Left: Value Proposition */}
            <div className="space-y-6 lg:sticky lg:top-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Know Your Worth in{" "}
                  <span className="text-primary">Seconds</span>
                </h1>
                <p className="text-muted-foreground mt-3 text-lg">
                  Get an instant rate estimate based on your follower count,
                  platform, and niche. No signup required.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {[
                  "See your estimated rate range instantly",
                  "Based on 2025 industry standards",
                  "Learn what factors can increase your rate",
                  "Works for all major platforms",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Social Proof */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Used by{" "}
                  <span className="font-semibold text-foreground">10,000+</span>{" "}
                  creators to price their brand deals with confidence.
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                      <Calculator className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Quick Rate Calculator</CardTitle>
                      <CardDescription>
                        Enter your details to get an estimate
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <QuickCalculatorForm onResult={handleResult} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <QuickCalculatorResult result={result} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              Want a more accurate rate?{" "}
              <Link href="/sign-up" className="text-primary hover:underline">
                Create a free account
              </Link>{" "}
              for personalized pricing.
            </p>
            <p>&copy; {new Date().getFullYear()} RateCard.AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
