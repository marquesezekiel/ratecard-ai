import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock the modules before importing components
const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/dashboard");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Test User", email: "test@example.com" },
    isLoading: false,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  signOut: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Dashboard Onboarding Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockFetch.mockClear();
  });

  describe("Dashboard Access Gate", () => {
    it("redirects to /onboarding when quickSetupComplete is false", async () => {
      // Mock API response with incomplete profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            quickSetupComplete: false,
            profileCompleteness: 0,
            hasSeenDashboardTour: false,
          },
        }),
      });

      // Import and render after mocks are set up
      const { default: DashboardLayout } = await import(
        "@/app/dashboard/layout"
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/onboarding");
      });
    });

    it("loads dashboard when quickSetupComplete is true", async () => {
      // Mock API response with complete profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            quickSetupComplete: true,
            profileCompleteness: 75,
            hasSeenDashboardTour: true,
          },
        }),
      });

      const { default: DashboardLayout } = await import(
        "@/app/dashboard/layout"
      );

      render(
        <DashboardLayout>
          <div data-testid="dashboard-content">Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith("/onboarding");
      });

      // Dashboard content should be visible
      await waitFor(() => {
        expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      });
    });

    it("redirects to /onboarding when no profile exists", async () => {
      // Mock API response with no profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null,
        }),
      });

      const { default: DashboardLayout } = await import(
        "@/app/dashboard/layout"
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/onboarding");
      });
    });

    it("shows profile completion banner when profileCompleteness < 100", async () => {
      // Mock API response with incomplete profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            quickSetupComplete: true,
            profileCompleteness: 60,
            hasSeenDashboardTour: true,
          },
        }),
      });

      const { default: DashboardLayout } = await import(
        "@/app/dashboard/layout"
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByText(/Your profile is/)).toBeInTheDocument();
        expect(screen.getByText("60%")).toBeInTheDocument();
      });
    });

    it("hides profile completion banner when profileCompleteness is 100", async () => {
      // Mock API response with complete profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            quickSetupComplete: true,
            profileCompleteness: 100,
            hasSeenDashboardTour: true,
          },
        }),
      });

      const { default: DashboardLayout } = await import(
        "@/app/dashboard/layout"
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Your profile is/)).not.toBeInTheDocument();
      });
    });

    it("shows dashboard tour when hasSeenDashboardTour is false", async () => {
      // Mock API response with tour not seen
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            quickSetupComplete: true,
            profileCompleteness: 75,
            hasSeenDashboardTour: false,
          },
        }),
      });

      const { default: DashboardLayout } = await import(
        "@/app/dashboard/layout"
      );

      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Wait for tour to appear (it has a 500ms delay)
      await waitFor(
        () => {
          expect(
            screen.getByText(/Analyze Brand Messages/)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });
});
