"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Zap } from "lucide-react";
import type { ParsedBrief, CreatorProfile, FitScoreResult, PricingResult, Platform, ContentFormat } from "@/lib/types";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
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
  { value: "organic", label: "Organic only (I post it, that's it)", days: 0, exclusivity: "none" as const },
  { value: "30-day", label: "30-day paid usage", days: 30, exclusivity: "none" as const },
  { value: "90-day", label: "90-day paid usage", days: 90, exclusivity: "none" as const },
  { value: "90-day-exclusive", label: "90-day + category exclusivity", days: 90, exclusivity: "category" as const },
  { value: "perpetual", label: "Unlimited/perpetual usage", days: -1, exclusivity: "none" as const },
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Quote
          </CardTitle>
          <CardDescription>
            Get an instant rate without uploading a brief. Perfect for DM inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brand Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name (optional)</Label>
            <Input
              id="brandName"
              placeholder="e.g., Nike, Glossier"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if you don&apos;t know yet
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label>Platform *</Label>
            <Select value={platform} onValueChange={(val) => {
              setPlatform(val);
              setFormat("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
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
            <Label>Content Type *</Label>
            <Select value={format} onValueChange={setFormat} disabled={!platform}>
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
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
            <Label htmlFor="quantity">How many?</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground">
                {format || "deliverables"}
              </span>
            </div>
          </div>

          {/* Usage Rights */}
          <div className="space-y-3">
            <Label>Usage Rights</Label>
            <RadioGroup value={usageOption} onValueChange={setUsageOption}>
              {USAGE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              &quot;Paid usage&quot; means the brand can use your content in their ads.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Get My Rate
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
