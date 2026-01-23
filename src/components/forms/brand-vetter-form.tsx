"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Shield, Search, Globe, AtSign, Mail } from "lucide-react";
import { toast } from "sonner";
import type { BrandVettingResult, Platform } from "@/lib/types";

interface BrandVetterFormProps {
  onVettingComplete?: (result: BrandVettingResult) => void;
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "threads", label: "Threads" },
  { value: "pinterest", label: "Pinterest" },
  { value: "twitch", label: "Twitch" },
  { value: "snapchat", label: "Snapchat" },
  { value: "lemon8", label: "Lemon8" },
  { value: "bluesky", label: "Bluesky" },
];

const VETTING_STEPS = [
  "Checking social presence...",
  "Verifying website...",
  "Searching for collaborations...",
  "Scanning for red flags...",
];

/**
 * Brand Vetter Form Component
 *
 * Allows creators to enter brand information for legitimacy checking.
 * Supports pre-filling from URL query params (integration with Message Analyzer).
 */
export function BrandVetterForm({ onVettingComplete }: BrandVetterFormProps) {
  const searchParams = useSearchParams();

  // Form state
  const [brandName, setBrandName] = useState("");
  const [brandHandle, setBrandHandle] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");

  // Loading state with step indicator
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from URL params (from Message Analyzer integration)
  useEffect(() => {
    const brand = searchParams.get("brand");
    const handle = searchParams.get("handle");
    const website = searchParams.get("website");
    const email = searchParams.get("email");
    const platformParam = searchParams.get("platform");

    if (brand) setBrandName(brand);
    if (handle) setBrandHandle(handle.replace("@", ""));
    if (website) setBrandWebsite(website);
    if (email) setBrandEmail(email);
    if (platformParam && PLATFORMS.some((p) => p.value === platformParam)) {
      setPlatform(platformParam as Platform);
    }
  }, [searchParams]);

  // Animate loading steps
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % VETTING_STEPS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName.trim()) {
      setError("Please enter a brand name");
      return;
    }

    if (!platform) {
      setError("Please select a platform");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vet-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          brandHandle: brandHandle.trim() || undefined,
          brandWebsite: brandWebsite.trim() || undefined,
          brandEmail: brandEmail.trim() || undefined,
          platform,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to vet brand");
      }

      onVettingComplete?.(result.data);
      toast.success("Brand vetting complete");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBrandName("");
    setBrandHandle("");
    setBrandWebsite("");
    setBrandEmail("");
    setPlatform("");
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Check Brand Legitimacy
        </CardTitle>
        <CardDescription>
          Enter the brand&apos;s details below. The more information you provide, the more accurate
          our assessment will be.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Brand Name (Required) */}
          <div className="space-y-2">
            <Label htmlFor="brand-name">
              Brand Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="brand-name"
              placeholder="e.g., GlowSkin Beauty"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Brand Handle (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="brand-handle" className="flex items-center gap-2">
              <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
              Social Handle
            </Label>
            <Input
              id="brand-handle"
              placeholder="e.g., glowskinbeauty"
              value={brandHandle}
              onChange={(e) => setBrandHandle(e.target.value.replace("@", ""))}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Without the @ symbol</p>
          </div>

          {/* Brand Website (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="brand-website" className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Website
            </Label>
            <Input
              id="brand-website"
              placeholder="e.g., glowskin.com"
              value={brandWebsite}
              onChange={(e) => setBrandWebsite(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Don&apos;t worry about https://</p>
          </div>

          {/* Brand Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="brand-email" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Contact Email
            </Label>
            <Input
              id="brand-email"
              type="email"
              placeholder="e.g., partnerships@glowskin.com"
              value={brandEmail}
              onChange={(e) => setBrandEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Platform (Required) */}
          <div className="space-y-2">
            <Label htmlFor="platform">
              Where did they reach out? <span className="text-red-500">*</span>
            </Label>
            <Select
              value={platform}
              onValueChange={(v) => setPlatform(v as Platform)}
              disabled={loading}
            >
              <SelectTrigger id="platform">
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

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Researching brand...</p>
                  <p className="text-sm text-blue-600">{VETTING_STEPS[loadingStep]}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || !brandName.trim() || !platform}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Check Brand
                </>
              )}
            </Button>
            {(brandName || brandHandle || brandWebsite || brandEmail || platform) && !loading && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
