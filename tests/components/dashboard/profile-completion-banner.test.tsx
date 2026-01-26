import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileCompletionBanner } from "@/components/dashboard/profile-completion-banner";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ProfileCompletionBanner", () => {
  const DISMISS_KEY = "profile-banner-dismissed";

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows banner when completeness is less than 100%", () => {
    render(<ProfileCompletionBanner completeness={75} />);

    expect(screen.getByText(/Your profile is/)).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("hides banner when completeness is 100%", () => {
    render(<ProfileCompletionBanner completeness={100} />);

    expect(screen.queryByText(/Your profile is/)).not.toBeInTheDocument();
  });

  it("hides banner when completeness is greater than 100%", () => {
    render(<ProfileCompletionBanner completeness={105} />);

    expect(screen.queryByText(/Your profile is/)).not.toBeInTheDocument();
  });

  it("displays the correct percentage", () => {
    render(<ProfileCompletionBanner completeness={42} />);

    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("has a Complete Profile link to /dashboard/profile", () => {
    render(<ProfileCompletionBanner completeness={50} />);

    const link = screen.getByRole("link", { name: /Complete Profile/i });
    expect(link).toHaveAttribute("href", "/dashboard/profile");
  });

  it("has a dismiss button", () => {
    render(<ProfileCompletionBanner completeness={50} />);

    const dismissButton = screen.getByRole("button", { name: /Dismiss banner/i });
    expect(dismissButton).toBeInTheDocument();
  });

  it("hides banner when dismiss button is clicked", () => {
    render(<ProfileCompletionBanner completeness={50} />);

    const dismissButton = screen.getByRole("button", { name: /Dismiss banner/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/Your profile is/)).not.toBeInTheDocument();
  });

  it("saves dismiss timestamp to localStorage", () => {
    const now = new Date("2024-01-15T10:00:00Z").getTime();
    vi.setSystemTime(now);

    render(<ProfileCompletionBanner completeness={50} />);

    const dismissButton = screen.getByRole("button", { name: /Dismiss banner/i });
    fireEvent.click(dismissButton);

    expect(localStorage.getItem(DISMISS_KEY)).toBe(now.toString());
  });

  it("stays hidden if dismissed less than 24 hours ago", () => {
    const now = new Date("2024-01-15T10:00:00Z").getTime();
    const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;

    // Simulate previous dismiss
    localStorage.setItem(DISMISS_KEY, twentyThreeHoursAgo.toString());
    vi.setSystemTime(now);

    render(<ProfileCompletionBanner completeness={50} />);

    // Banner should be hidden
    expect(screen.queryByText(/Your profile is/)).not.toBeInTheDocument();
  });

  it("reappears after 24 hours since dismissal", () => {
    const now = new Date("2024-01-15T10:00:00Z").getTime();
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;

    // Simulate previous dismiss more than 24 hours ago
    localStorage.setItem(DISMISS_KEY, twentyFiveHoursAgo.toString());
    vi.setSystemTime(now);

    render(<ProfileCompletionBanner completeness={50} />);

    // Banner should reappear
    expect(screen.getByText(/Your profile is/)).toBeInTheDocument();
  });

  it("shows with 0% completeness", () => {
    render(<ProfileCompletionBanner completeness={0} />);

    expect(screen.getByText(/Your profile is/)).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows with 99% completeness", () => {
    render(<ProfileCompletionBanner completeness={99} />);

    expect(screen.getByText(/Your profile is/)).toBeInTheDocument();
    expect(screen.getByText("99%")).toBeInTheDocument();
  });
});
