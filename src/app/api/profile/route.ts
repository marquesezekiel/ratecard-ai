import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import type { ApiResponse, CreatorProfile } from "@/lib/types";
import { calculateProfileCompleteness } from "@/lib/onboarding";

/**
 * GET /api/profile
 *
 * Get the current user's creator profile.
 */
export async function GET(): Promise<NextResponse<ApiResponse<CreatorProfile | null>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      data: profile as CreatorProfile | null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 *
 * Create or update the current user's creator profile.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CreatorProfile>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      displayName,
      handle,
      bio,
      location,
      niches,
      instagram,
      tiktok,
      youtube,
      twitter,
      audience,
      tier,
      totalReach,
      avgEngagementRate,
      quickSetupComplete,
      hasSeenDashboardTour,
    } = body;

    // Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(body as Partial<CreatorProfile>);

    // Upsert profile
    const profile = await db.creatorProfile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName: displayName ?? "Creator",
        handle: handle ?? "creator",
        bio,
        location,
        niches: niches ?? [],
        instagram,
        tiktok,
        youtube,
        twitter,
        audience,
        tier: tier ?? "nano",
        totalReach: totalReach ?? 0,
        avgEngagementRate: avgEngagementRate ?? 0,
        profileCompleteness,
        quickSetupComplete: quickSetupComplete ?? false,
        hasSeenDashboardTour: hasSeenDashboardTour ?? false,
        onboardingCompletedAt: quickSetupComplete ? new Date() : null,
      },
      create: {
        userId: session.user.id,
        displayName: displayName ?? "Creator",
        handle: handle ?? "creator",
        bio,
        location,
        niches: niches ?? [],
        instagram,
        tiktok,
        youtube,
        twitter,
        audience,
        tier: tier ?? "nano",
        totalReach: totalReach ?? 0,
        avgEngagementRate: avgEngagementRate ?? 0,
        profileCompleteness,
        quickSetupComplete: quickSetupComplete ?? false,
        hasSeenDashboardTour: hasSeenDashboardTour ?? false,
        onboardingCompletedAt: quickSetupComplete ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: profile as unknown as CreatorProfile,
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 *
 * Partially update the current user's creator profile.
 */
export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CreatorProfile>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Get current profile to merge with updates
    const currentProfile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Merge with current profile for completeness calculation
    const mergedProfile = { ...currentProfile, ...body };
    const profileCompleteness = calculateProfileCompleteness(
      mergedProfile as unknown as Partial<CreatorProfile>
    );

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = { profileCompleteness };

    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.handle !== undefined) updateData.handle = body.handle;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.niches !== undefined) updateData.niches = body.niches;
    if (body.instagram !== undefined) updateData.instagram = body.instagram;
    if (body.tiktok !== undefined) updateData.tiktok = body.tiktok;
    if (body.youtube !== undefined) updateData.youtube = body.youtube;
    if (body.twitter !== undefined) updateData.twitter = body.twitter;
    if (body.audience !== undefined) updateData.audience = body.audience;
    if (body.tier !== undefined) updateData.tier = body.tier;
    if (body.totalReach !== undefined) updateData.totalReach = body.totalReach;
    if (body.avgEngagementRate !== undefined) updateData.avgEngagementRate = body.avgEngagementRate;
    if (body.quickSetupComplete !== undefined) {
      updateData.quickSetupComplete = body.quickSetupComplete;
      if (body.quickSetupComplete && !currentProfile.onboardingCompletedAt) {
        updateData.onboardingCompletedAt = new Date();
      }
    }
    if (body.hasSeenDashboardTour !== undefined) updateData.hasSeenDashboardTour = body.hasSeenDashboardTour;

    const profile = await db.creatorProfile.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: profile as unknown as CreatorProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
