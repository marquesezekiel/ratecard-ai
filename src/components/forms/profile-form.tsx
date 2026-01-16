"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { calculateTier } from "@/lib/pricing-engine";
import type { CreatorProfile, PlatformMetrics, CurrencyCode } from "@/lib/types";
import { CURRENCIES } from "@/lib/types";

// =============================================================================
// CONSTANTS
// =============================================================================

const AVAILABLE_NICHES = [
  "lifestyle",
  "fashion",
  "beauty",
  "fitness",
  "travel",
  "food",
  "tech",
  "gaming",
  "parenting",
  "finance",
  "education",
  "entertainment",
  "home",
  "pets",
  "automotive",
] as const;

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Brazil",
  "India",
  "Mexico",
  "Spain",
  "Italy",
  "Netherlands",
  "Japan",
  "South Korea",
  "Singapore",
  "Other",
] as const;

const AGE_RANGES = [
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
] as const;

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const platformMetricsSchema = z.object({
  followers: z.number().min(0).optional(),
  engagementRate: z.number().min(0).max(100).optional(),
  avgLikes: z.number().min(0).optional(),
  avgComments: z.number().min(0).optional(),
  avgViews: z.number().min(0).optional(),
});

const currencyOptions = ["USD", "GBP", "EUR", "CAD", "AUD", "BRL", "INR", "MXN"] as const;

const profileFormSchema = z.object({
  // Section 1: Basic Info
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  handle: z.string().min(2, "Handle must be at least 2 characters").regex(/^[a-zA-Z0-9._]+$/, "Handle can only contain letters, numbers, dots, and underscores"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  location: z.string().min(1, "Please select your location"),
  currency: z.enum(currencyOptions),
  niches: z.array(z.string()).min(1, "Select at least one niche").max(5, "Maximum 5 niches allowed"),

  // Section 2: Platform Metrics
  instagram: platformMetricsSchema.optional(),
  tiktok: platformMetricsSchema.optional(),
  youtube: platformMetricsSchema.optional(),
  twitter: platformMetricsSchema.optional(),

  // Section 3: Audience Demographics
  audience: z.object({
    ageRange: z.string().min(1, "Please select primary age range"),
    genderSplit: z.object({
      male: z.number().min(0).max(100),
      female: z.number().min(0).max(100),
      other: z.number().min(0).max(100),
    }),
    topLocations: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateTotalFollowers(values: ProfileFormValues): number {
  let total = 0;
  if (values.instagram?.followers) total += values.instagram.followers;
  if (values.tiktok?.followers) total += values.tiktok.followers;
  if (values.youtube?.followers) total += values.youtube.followers;
  if (values.twitter?.followers) total += values.twitter.followers;
  return total;
}

function calculateAvgEngagement(values: ProfileFormValues): number {
  const platforms: { followers: number; engagement: number }[] = [];

  if (values.instagram?.followers && values.instagram?.engagementRate) {
    platforms.push({ followers: values.instagram.followers, engagement: values.instagram.engagementRate });
  }
  if (values.tiktok?.followers && values.tiktok?.engagementRate) {
    platforms.push({ followers: values.tiktok.followers, engagement: values.tiktok.engagementRate });
  }
  if (values.youtube?.followers && values.youtube?.engagementRate) {
    platforms.push({ followers: values.youtube.followers, engagement: values.youtube.engagementRate });
  }
  if (values.twitter?.followers && values.twitter?.engagementRate) {
    platforms.push({ followers: values.twitter.followers, engagement: values.twitter.engagementRate });
  }

  if (platforms.length === 0) return 0;

  // Weighted average by followers
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
  const weightedSum = platforms.reduce((sum, p) => sum + p.engagement * p.followers, 0);

  return totalFollowers > 0 ? weightedSum / totalFollowers : 0;
}

/**
 * Calculate estimated metrics from followers and engagement rate
 * Based on industry benchmarks for social media content
 */
function calculateEstimatedMetrics(followers: number, engagementRate: number) {
  const estimatedLikes = Math.round(followers * (engagementRate / 100));
  const estimatedComments = Math.round(estimatedLikes / 25); // ~4% of likes are comments
  const estimatedViews = Math.round(followers * 1.5); // Avg views ~150% of followers for video

  return { estimatedLikes, estimatedComments, estimatedViews };
}

// Type for tracking which fields are estimated per platform
type PlatformName = "instagram" | "tiktok" | "youtube" | "twitter";
type EstimatedFieldName = "avgLikes" | "avgComments" | "avgViews";
type EstimatedFieldsState = Record<PlatformName, Set<EstimatedFieldName>>;

// =============================================================================
// COMPONENT
// =============================================================================

interface ProfileFormProps {
  initialData?: Partial<ProfileFormValues>;
}

// Helper to create initial estimated fields state
function createInitialEstimatedFieldsState(): EstimatedFieldsState {
  const defaultSet = (): Set<EstimatedFieldName> => new Set(["avgLikes", "avgComments", "avgViews"]);
  return {
    instagram: defaultSet(),
    tiktok: defaultSet(),
    youtube: defaultSet(),
    twitter: defaultSet(),
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [selectedNiches, setSelectedNiches] = useState<string[]>(initialData?.niches ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track which fields are estimated (auto-calculated) vs manually entered
  const [estimatedFields, setEstimatedFields] = useState<EstimatedFieldsState>(() => {
    // If initial data has manually-set metrics, don't mark them as estimated
    const state = createInitialEstimatedFieldsState();
    const platforms: PlatformName[] = ["instagram", "tiktok", "youtube", "twitter"];

    platforms.forEach((platform) => {
      const data = initialData?.[platform];
      if (data) {
        // If they have a value that's different from what we'd estimate, mark as manual
        if (data.avgLikes && data.avgLikes > 0) state[platform].delete("avgLikes");
        if (data.avgComments && data.avgComments > 0) state[platform].delete("avgComments");
        if (data.avgViews && data.avgViews > 0) state[platform].delete("avgViews");
      }
    });

    return state;
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: initialData?.displayName ?? "",
      handle: initialData?.handle ?? "",
      bio: initialData?.bio ?? "",
      location: initialData?.location ?? "",
      currency: (initialData as ProfileFormValues | undefined)?.currency ?? "USD",
      niches: initialData?.niches ?? [],
      instagram: initialData?.instagram ?? { followers: 0, engagementRate: 0, avgLikes: 0, avgComments: 0, avgViews: 0 },
      tiktok: initialData?.tiktok ?? { followers: 0, engagementRate: 0, avgLikes: 0, avgComments: 0, avgViews: 0 },
      youtube: initialData?.youtube ?? { followers: 0, engagementRate: 0, avgLikes: 0, avgComments: 0, avgViews: 0 },
      twitter: initialData?.twitter ?? { followers: 0, engagementRate: 0, avgLikes: 0, avgComments: 0, avgViews: 0 },
      audience: initialData?.audience ?? {
        ageRange: "",
        genderSplit: { male: 0, female: 0, other: 0 },
        topLocations: [],
        interests: [],
      },
    },
  });

  // Watch followers and engagement rate for all platforms to auto-calculate metrics
  const watchedInstagram = useWatch({ control: form.control, name: "instagram" });
  const watchedTiktok = useWatch({ control: form.control, name: "tiktok" });
  const watchedYoutube = useWatch({ control: form.control, name: "youtube" });
  const watchedTwitter = useWatch({ control: form.control, name: "twitter" });

  // Auto-calculate estimated metrics when followers or engagement rate changes
  const updateEstimatedMetrics = useCallback(
    (platform: PlatformName, followers: number | undefined, engagementRate: number | undefined) => {
      if (!followers || !engagementRate || followers < 100 || engagementRate < 0.1) return;

      const { estimatedLikes, estimatedComments, estimatedViews } = calculateEstimatedMetrics(
        followers,
        engagementRate
      );

      // Only update fields that are still marked as estimated
      const platformEstimated = estimatedFields[platform];

      if (platformEstimated.has("avgLikes")) {
        form.setValue(`${platform}.avgLikes`, estimatedLikes, { shouldDirty: false });
      }
      if (platformEstimated.has("avgComments")) {
        form.setValue(`${platform}.avgComments`, estimatedComments, { shouldDirty: false });
      }
      if (platformEstimated.has("avgViews")) {
        form.setValue(`${platform}.avgViews`, estimatedViews, { shouldDirty: false });
      }
    },
    [estimatedFields, form]
  );

  // Effect to recalculate when followers or engagement changes
  useEffect(() => {
    updateEstimatedMetrics("instagram", watchedInstagram?.followers, watchedInstagram?.engagementRate);
  }, [watchedInstagram?.followers, watchedInstagram?.engagementRate, updateEstimatedMetrics]);

  useEffect(() => {
    updateEstimatedMetrics("tiktok", watchedTiktok?.followers, watchedTiktok?.engagementRate);
  }, [watchedTiktok?.followers, watchedTiktok?.engagementRate, updateEstimatedMetrics]);

  useEffect(() => {
    updateEstimatedMetrics("youtube", watchedYoutube?.followers, watchedYoutube?.engagementRate);
  }, [watchedYoutube?.followers, watchedYoutube?.engagementRate, updateEstimatedMetrics]);

  useEffect(() => {
    updateEstimatedMetrics("twitter", watchedTwitter?.followers, watchedTwitter?.engagementRate);
  }, [watchedTwitter?.followers, watchedTwitter?.engagementRate, updateEstimatedMetrics]);

  // Handler to mark a field as manually edited (no longer estimated)
  const markAsManuallyEdited = (platform: PlatformName, field: EstimatedFieldName) => {
    setEstimatedFields((prev) => {
      const newState = { ...prev };
      const newSet = new Set(prev[platform]);
      newSet.delete(field);
      newState[platform] = newSet;
      return newState;
    });
  };

  // Check if a field is estimated
  const isEstimated = (platform: PlatformName, field: EstimatedFieldName): boolean => {
    return estimatedFields[platform].has(field);
  };

  const toggleNiche = (niche: string) => {
    const current = form.getValues("niches");
    let updated: string[];

    if (current.includes(niche)) {
      updated = current.filter((n) => n !== niche);
    } else if (current.length < 5) {
      updated = [...current, niche];
    } else {
      return; // Max 5 niches
    }

    setSelectedNiches(updated);
    form.setValue("niches", updated, { shouldValidate: true });
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);

    try {
      // Calculate derived values
      const totalReach = calculateTotalFollowers(values);
      const avgEngagementRate = calculateAvgEngagement(values);
      const tier = calculateTier(totalReach);

      // Build the complete profile
      const profile: Omit<CreatorProfile, "id" | "userId" | "createdAt" | "updatedAt"> = {
        displayName: values.displayName,
        handle: values.handle,
        bio: values.bio ?? "",
        location: values.location,
        currency: values.currency as CurrencyCode,
        niches: values.niches,
        instagram: values.instagram?.followers ? values.instagram as PlatformMetrics : undefined,
        tiktok: values.tiktok?.followers ? values.tiktok as PlatformMetrics : undefined,
        youtube: values.youtube?.followers ? values.youtube as PlatformMetrics : undefined,
        twitter: values.twitter?.followers ? values.twitter as PlatformMetrics : undefined,
        audience: {
          ageRange: values.audience.ageRange,
          genderSplit: values.audience.genderSplit,
          topLocations: values.audience.topLocations ?? [values.location],
          interests: values.audience.interests ?? values.niches,
        },
        tier,
        totalReach,
        avgEngagementRate,
      };

      // Save to localStorage for MVP
      localStorage.setItem("creatorProfile", JSON.stringify(profile));

      // Redirect to upload page
      router.push("/dashboard/upload");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>
              Tell brands who you are. This info appears on your rate card.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Maya Creates" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Handle</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input className="pl-7" placeholder="maya.creates" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lifestyle creator sharing fashion, wellness, and everyday inspiration..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. A short description of what you create.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your rate card will display prices in this currency
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="niches"
              render={() => (
                <FormItem>
                  <FormLabel>Niches</FormLabel>
                  <FormDescription>
                    Select up to 5 content categories that best describe your content.
                  </FormDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {AVAILABLE_NICHES.map((niche) => {
                      const isSelected = selectedNiches.includes(niche);
                      return (
                        <Badge
                          key={niche}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => toggleNiche(niche)}
                        >
                          {niche}
                          {isSelected && <X className="ml-1 h-3 w-3" />}
                        </Badge>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Platform Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
            <CardDescription>
              Just enter your followers and engagement rate—we&apos;ll estimate the rest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="instagram" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                <TabsTrigger value="youtube">YouTube</TabsTrigger>
                <TabsTrigger value="twitter">Twitter</TabsTrigger>
              </TabsList>

              {(["instagram", "tiktok", "youtube", "twitter"] as const).map((platform) => (
                <TabsContent key={platform} value={platform} className="space-y-6 pt-4">
                  {/* Required fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`${platform}.followers`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Followers <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="18000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`${platform}.engagementRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Engagement Rate (%) <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="4.2"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            (Likes + Comments) / Followers × 100
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Estimated metrics section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-t pt-4">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Estimated metrics
                      </span>
                      <span className="text-xs text-muted-foreground">
                        — edit if you know your exact numbers
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`${platform}.avgLikes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Avg Likes
                              {isEstimated(platform, "avgLikes") && (
                                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                  <BarChart3 className="h-3 w-3" />
                                  estimated
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="756"
                                className={isEstimated(platform, "avgLikes") ? "text-muted-foreground" : ""}
                                {...field}
                                onChange={(e) => {
                                  markAsManuallyEdited(platform, "avgLikes");
                                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0);
                                }}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`${platform}.avgComments`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Avg Comments
                              {isEstimated(platform, "avgComments") && (
                                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                  <BarChart3 className="h-3 w-3" />
                                  estimated
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="42"
                                className={isEstimated(platform, "avgComments") ? "text-muted-foreground" : ""}
                                {...field}
                                onChange={(e) => {
                                  markAsManuallyEdited(platform, "avgComments");
                                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0);
                                }}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`${platform}.avgViews`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="flex items-center gap-2">
                              Avg Views
                              {isEstimated(platform, "avgViews") && (
                                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                  <BarChart3 className="h-3 w-3" />
                                  estimated
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="12000"
                                className={isEstimated(platform, "avgViews") ? "text-muted-foreground" : ""}
                                {...field}
                                onChange={(e) => {
                                  markAsManuallyEdited(platform, "avgViews");
                                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0);
                                }}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              For video content (Reels, TikToks, YouTube videos)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Section 3: Audience Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Demographics</CardTitle>
            <CardDescription>
              Help brands understand who follows you. Check your platform analytics for this info.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="audience.ageRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Age Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select primary age range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AGE_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The age group that makes up most of your audience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Gender Split (%)</FormLabel>
              <FormDescription>
                Should add up to 100%. Check your platform analytics.
              </FormDescription>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="audience.genderSplit.male"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Male</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="35"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audience.genderSplit.female"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Female</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="60"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audience.genderSplit.other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Other</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
