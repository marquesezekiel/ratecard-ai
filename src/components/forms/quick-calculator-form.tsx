"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calculator } from "lucide-react";
import { calculateQuickEstimate } from "@/lib/quick-calculator";
import type { QuickEstimateResult, Platform, ContentFormat } from "@/lib/types";

// All supported platforms
const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "twitter", label: "Twitter/X" },
  { value: "threads", label: "Threads" },
  { value: "pinterest", label: "Pinterest" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "snapchat", label: "Snapchat" },
  { value: "twitch", label: "Twitch" },
  { value: "bluesky", label: "Bluesky" },
  { value: "lemon8", label: "Lemon8" },
];

// Content formats
const FORMATS: { value: ContentFormat; label: string }[] = [
  { value: "static", label: "Static Post" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel / Short Video" },
  { value: "video", label: "Long-form Video" },
  { value: "live", label: "Live Stream" },
];

// Common niches
const NICHES = [
  { value: "lifestyle", label: "Lifestyle" },
  { value: "beauty", label: "Beauty / Skincare" },
  { value: "fashion", label: "Fashion" },
  { value: "fitness", label: "Fitness / Wellness" },
  { value: "food", label: "Food / Cooking" },
  { value: "travel", label: "Travel" },
  { value: "tech", label: "Tech / Software" },
  { value: "finance", label: "Finance / Investing" },
  { value: "business", label: "Business / B2B" },
  { value: "parenting", label: "Parenting / Family" },
  { value: "gaming", label: "Gaming" },
  { value: "entertainment", label: "Entertainment / Comedy" },
];

interface QuickCalculatorFormProps {
  onResult: (result: QuickEstimateResult) => void;
}

export function QuickCalculatorForm({ onResult }: QuickCalculatorFormProps) {
  const [followerCount, setFollowerCount] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [contentFormat, setContentFormat] = useState<ContentFormat | "">("");
  const [niche, setNiche] = useState("lifestyle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format number with commas for display
  const formatNumber = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue).toLocaleString();
  };

  // Get raw numeric value from formatted string
  const getNumericValue = (value: string): number => {
    const numericValue = value.replace(/[^0-9]/g, "");
    return parseInt(numericValue) || 0;
  };

  const handleFollowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setFollowerCount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const followers = getNumericValue(followerCount);

    // Validation
    if (followers < 1000) {
      setError("Enter your follower count (minimum 1,000)");
      return;
    }

    if (!platform) {
      setError("Please select a platform");
      return;
    }

    if (!contentFormat) {
      setError("Please select a content type");
      return;
    }

    setLoading(true);

    // Simulate a brief delay for UX (calculation is instant)
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const result = calculateQuickEstimate({
        followerCount: followers,
        platform: platform as Platform,
        contentFormat: contentFormat as ContentFormat,
        niche,
      });

      onResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Follower Count */}
      <div className="space-y-2">
        <Label htmlFor="followers">
          Follower Count <span className="text-destructive">*</span>
        </Label>
        <Input
          id="followers"
          type="text"
          inputMode="numeric"
          placeholder="e.g., 50,000"
          value={followerCount}
          onChange={handleFollowerChange}
          className="text-lg h-12"
        />
        <p className="text-xs text-muted-foreground">
          Your total followers on your primary platform
        </p>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <Label>
          Platform <span className="text-destructive">*</span>
        </Label>
        <Select
          value={platform}
          onValueChange={(val) => setPlatform(val as Platform)}
        >
          <SelectTrigger className="h-12">
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
        <Label>
          Content Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={contentFormat}
          onValueChange={(val) => setContentFormat(val as ContentFormat)}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="What are you creating?" />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Niche */}
      <div className="space-y-2">
        <Label>
          Your Niche{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select your primary niche" />
          </SelectTrigger>
          <SelectContent>
            {NICHES.map((n) => (
              <SelectItem key={n.value} value={n.value}>
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 text-base"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Calculator className="mr-2 h-5 w-5" />
            Calculate My Rate
          </>
        )}
      </Button>
    </form>
  );
}
