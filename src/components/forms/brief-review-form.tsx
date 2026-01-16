"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import type { ParsedBrief } from "@/lib/types";

const INDUSTRIES = [
  "fashion", "fitness", "technology", "food", "travel", "beauty",
  "finance", "education", "entertainment", "parenting", "automotive",
  "gaming", "home", "pets", "other"
];

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter"];

const FORMATS = [
  { value: "static", label: "Static Post" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "video", label: "Video" },
  { value: "live", label: "Live Stream" },
  { value: "ugc", label: "UGC Only" },
];

const USAGE_DURATIONS = [
  { value: 0, label: "Organic only (no paid usage)" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
  { value: -1, label: "Perpetual / Forever" },
];

const EXCLUSIVITY_OPTIONS = [
  { value: "none", label: "No exclusivity" },
  { value: "category", label: "Category exclusivity" },
  { value: "full", label: "Full exclusivity" },
];

interface BriefReviewFormProps {
  initialBrief: Omit<ParsedBrief, "id">;
  onConfirm: (brief: Omit<ParsedBrief, "id">) => void;
  onReparse: () => void;
}

type BriefSection = "brand" | "content" | "usageRights";

export function BriefReviewForm({ initialBrief, onConfirm, onReparse }: BriefReviewFormProps) {
  const [brief, setBrief] = useState(initialBrief);
  const [hasEdits, setHasEdits] = useState(false);

  const updateField = <K extends BriefSection>(
    section: K,
    field: keyof ParsedBrief[K],
    value: ParsedBrief[K][keyof ParsedBrief[K]]
  ) => {
    setBrief(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasEdits(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Brief Parsed Successfully</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Review the extracted details below. Click any field to edit if something looks wrong.
          </p>
        </div>
        {hasEdits && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Edited
          </span>
        )}
      </div>

      {/* AI Confidence Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">AI extraction isn&apos;t perfect</p>
          <p className="text-sm text-amber-700 mt-1">
            Please double-check everything—especially usage rights and exclusivity,
            as these significantly impact pricing.
          </p>
        </div>
      </div>

      {/* Brand Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Brand Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={brief.brand.name}
                onChange={(e) => updateField("brand", "name", e.target.value)}
                placeholder="e.g., Glossier"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={brief.brand.industry.toLowerCase()}
                onValueChange={(val) => updateField("brand", "industry", val)}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry.charAt(0).toUpperCase() + industry.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Content Requirements</CardTitle>
          <CardDescription>What they&apos;re asking you to create</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={brief.content.platform}
                onValueChange={(val) => updateField("content", "platform", val as ParsedBrief["content"]["platform"])}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Content Format</Label>
              <Select
                value={brief.content.format}
                onValueChange={(val) => updateField("content", "format", val as ParsedBrief["content"]["format"])}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={20}
                value={brief.content.quantity}
                onChange={(e) => updateField("content", "quantity", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Rights Section - CRITICAL */}
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Usage Rights</CardTitle>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              High pricing impact
            </span>
          </div>
          <CardDescription>
            These settings significantly affect your rate. Please verify carefully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="usageDuration">Paid Usage Duration</Label>
              <Select
                value={brief.usageRights.durationDays.toString()}
                onValueChange={(val) => updateField("usageRights", "durationDays", parseInt(val))}
              >
                <SelectTrigger id="usageDuration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_DURATIONS.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How long can the brand use your content in paid ads?
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exclusivity">Exclusivity</Label>
              <Select
                value={brief.usageRights.exclusivity}
                onValueChange={(val) => updateField("usageRights", "exclusivity", val as ParsedBrief["usageRights"]["exclusivity"])}
              >
                <SelectTrigger id="exclusivity">
                  <SelectValue placeholder="Select exclusivity" />
                </SelectTrigger>
                <SelectContent>
                  {EXCLUSIVITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Are you restricted from working with competitors?
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onReparse}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Upload Different Brief
        </Button>
        <Button onClick={() => onConfirm(brief)} className="sm:flex-1 sm:max-w-xs">
          {hasEdits ? "Use My Edits" : "Looks Good"} → Calculate Rate
        </Button>
      </div>
    </div>
  );
}
