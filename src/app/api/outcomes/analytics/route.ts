import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOutcomeAnalytics } from "@/lib/outcome-analytics";
import type { ApiResponse, OutcomeAnalytics } from "@/lib/types";

/**
 * GET /api/outcomes/analytics
 *
 * Get comprehensive outcome analytics for the authenticated creator.
 *
 * Returns: ApiResponse<OutcomeAnalytics>
 */
export async function GET(): Promise<NextResponse<ApiResponse<OutcomeAnalytics>>> {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    // Get analytics
    const analytics = await getOutcomeAnalytics(session.user.id);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get outcome analytics error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics. Please try again." },
      { status: 500 }
    );
  }
}
