/**
 * Layout constants for consistent spacing across the app.
 * Based on 8px spacing system.
 *
 * Spacing System:
 * - Component gap: 16px (gap-4, space-y-4)
 * - Section gap: 24px (gap-6, space-y-6)
 * - Large section gap: 32px (gap-8, space-y-8)
 * - Card padding: 24px (p-6)
 * - Mobile card padding: 16px (p-4)
 */

export const layout = {
  // Container max widths
  container: {
    sm: "max-w-2xl", // Forms, single column (672px)
    md: "max-w-4xl", // Most pages (896px)
    lg: "max-w-5xl", // Wide layouts (1024px) - matches dashboard layout
    xl: "max-w-6xl", // Extra wide (1152px)
  },

  // Spacing patterns
  spacing: {
    // Main content area sections
    section: "space-y-6",
    // Larger gaps for major sections
    sectionLg: "space-y-8",
    // Component-level spacing (form fields, list items)
    component: "space-y-4",
    // Small spacing for tight groups
    tight: "space-y-2",
    // Card padding
    card: "p-6",
    cardCompact: "p-4",
  },

  // Grid gaps
  grid: {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  },

  // Common page patterns
  pageHeader: "space-y-1 mb-6",
  pageHeaderCentered: "text-center space-y-2 mb-6",
  sectionHeader: "space-y-1 mb-4",
} as const;

// Type for container widths
export type ContainerWidth = keyof typeof layout.container;
