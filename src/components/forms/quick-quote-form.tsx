"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Zap, Instagram, Youtube, Minus, Plus } from "lucide-react";
import type { ParsedBrief, CreatorProfile, FitScoreResult, PricingResult, Platform, ContentFormat } from "@/lib/types";

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "twitter", label: "Twitter/X" },
];

const FORMATS = [
  { value: "static", label: "Static Post", platforms: ["instagram", "twitter"] },
  { value: "carousel", label: "Carousel", platforms: ["instagram"] },
  { value: "story", label: "Story", platforms: ["instagram"] },
  { value: "reel", label: "Reel", platforms: ["instagram"] },
  { value: "video", label: "Short Video", platforms: ["tiktok", "youtube"] },
  { value: "live", label: "Live Stream", platforms: ["instagram", "tiktok", "youtube"] },
  { value: "ugc", label: "UGC Only (no posting)", platforms: ["instagram", "tiktok", "youtube"] },
];

const USAGE_OPTIONS = [
  { value: "organic", label: "Organic only", description: "I post it, that's it", days: 0, exclusivity: "none" as const },
  { value: "30-day", label: "30-day paid usage", description: "Brand can use in ads", days: 30, exclusivity: "none" as const },
  { value: "90-day", label: "90-day paid usage", description: "Extended ad rights", days: 90, exclusivity: "none" as const },
  { value: "90-day-exclusive", label: "90-day + exclusivity", description: "No competitor work", days: 90, exclusivity: "category" as const },
  { value: "perpetual", label: "Perpetual usage", description: "Forever rights", days: -1, exclusivity: "none" as const },
];

interface QuickQuoteFormProps {
  profile: CreatorProfile;
  onQuoteGenerated: (data: {
    brief: Omit<ParsedBrief, "id">;
    fitScore: FitScoreResult;
    pricing: PricingResult;
  }) => void;
}

export function QuickQuoteForm({ profile, onQuoteGenerated }: QuickQuoteFormProps) {
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [usageOption, setUsageOption] = useState("organic");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableFormats = FORMATS.filter(f =>
    f.platforms.includes(platform) || platform === ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platform || !format) {
      setError("Please select platform and content type");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedUsage = USAGE_OPTIONS.find(u => u.value === usageOption)!;

      // Construct a synthetic brief from the quick form
      const syntheticBrief: Omit<ParsedBrief, "id"> = {
        brand: {
          name: brandName || "Brand",
          industry: profile.niches[0] || "other",
          product: "Product",
        },
        campaign: {
          objective: "Brand awareness",
          targetAudience: "General audience",
          budgetRange: "Not specified",
        },
        content: {
          platform: platform as Platform,
          format: format as ContentFormat,
          quantity: quantity,
          creativeDirection: "Creator's discretion",
        },
        usageRights: {
          durationDays: selectedUsage.days,
          exclusivity: selectedUsage.exclusivity,
          paidAmplification: selectedUsage.days > 0,
        },
        timeline: {
          deadline: "Flexible",
        },
        rawText: `Quick quote for ${quantity}x ${format} on ${platform}`,
      };

      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, brief: syntheticBrief }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Calculation failed");
      }

      onQuoteGenerated({
        brief: syntheticBrief,
        fitScore: result.data.fitScore,
        pricing: result.data.pricing,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Quick Quote</CardTitle>
              <CardDescription>
                Get a rate in 30 seconds — perfect for DM inquiries
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Brand Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="brandName"
              placeholder="e.g., Nike, Glossier, Notion"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label>Platform <span className="text-destructive">*</span></Label>
            <Select value={platform} onValueChange={(val) => {
              setPlatform(val);
              setFormat("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Where will you post?" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Format */}
          <div className="space-y-2">
            <Label>Content Type <span className="text-destructive">*</span></Label>
            <Select value={format} onValueChange={setFormat} disabled={!platform}>
              <SelectTrigger>
                <SelectValue placeholder={platform ? "What are you creating?" : "Select platform first"} />
              </SelectTrigger>
              <SelectContent>
                {availableFormats.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>How many deliverables?</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-11 w-11"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 text-center text-lg font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
                className="h-11 w-11"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {format ? format + (quantity > 1 ? "s" : "") : "deliverable" + (quantity > 1 ? "s" : "")}
              </span>
            </div>
          </div>

          {/* Usage Rights */}
          <div className="space-y-3">
            <Label>Usage Rights</Label>
            <RadioGroup value={usageOption} onValueChange={setUsageOption} className="space-y-2">
              {USAGE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  htmlFor={option.value}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    usageOption === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <span className="font-medium">{option.label}</span>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" size="xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Calculating your rate...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Get My Rate
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
