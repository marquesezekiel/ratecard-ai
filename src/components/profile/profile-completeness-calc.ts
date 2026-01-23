/**
 * Calculate profile completeness percentage based on form values.
 * Weights different fields by importance.
 */
export function calculateProfileCompleteness(values: {
  displayName?: string;
  handle?: string;
  location?: string;
  niches?: string[];
  instagram?: { followers?: number; engagementRate?: number };
  tiktok?: { followers?: number; engagementRate?: number };
  youtube?: { followers?: number; engagementRate?: number };
  twitter?: { followers?: number; engagementRate?: number };
  audience?: {
    ageRange?: string;
    genderSplit?: { male?: number; female?: number; other?: number };
  };
}): number {
  let score = 0;
  const maxScore = 100;

  // Basic Info (40 points total)
  if (values.displayName && values.displayName.length >= 2) score += 10;
  if (values.handle && values.handle.length >= 2) score += 10;
  if (values.location && values.location.length > 0) score += 10;
  if (values.niches && values.niches.length > 0) score += 10;

  // Platform Metrics (40 points total)
  // Check if at least one platform has meaningful data
  const platforms = [
    values.instagram,
    values.tiktok,
    values.youtube,
    values.twitter,
  ];
  const platformsWithData = platforms.filter(
    (p) => p && p.followers && p.followers > 0
  );

  if (platformsWithData.length >= 1) score += 20;
  if (platformsWithData.length >= 2) score += 10;

  // Check if engagement rate is filled for any platform
  const platformsWithEngagement = platformsWithData.filter(
    (p) => p && p.engagementRate && p.engagementRate > 0
  );
  if (platformsWithEngagement.length >= 1) score += 10;

  // Audience Demographics (20 points total)
  if (values.audience?.ageRange && values.audience.ageRange.length > 0)
    score += 10;
  if (
    values.audience?.genderSplit &&
    (values.audience.genderSplit.male ||
      values.audience.genderSplit.female ||
      values.audience.genderSplit.other)
  ) {
    score += 10;
  }

  return Math.round((score / maxScore) * 100);
}
