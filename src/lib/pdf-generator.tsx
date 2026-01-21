import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  DocumentProps,
} from "@react-pdf/renderer";
import type {
  CreatorProfile,
  ParsedBrief,
  FitScoreResult,
  PricingResult,
  PricingModel,
  PDFExportMode,
} from "./types";
import { generateNegotiationTalkingPoints } from "./negotiation-talking-points";
import { getFTCGuidance, getCompensationType } from "./ftc-guidance";
import { getContractChecklist } from "./contract-checklist";

// Color palette
const colors = {
  primary: "#3B82F6",
  secondary: "#1E40AF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  dark: "#1F2937",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  white: "#FFFFFF",
};

// Fit level colors
const fitLevelColors: Record<string, string> = {
  perfect: colors.success,
  high: colors.primary,
  medium: colors.warning,
  low: colors.danger,
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 15,
  },
  creatorName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  handle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 8,
  },
  tierBadge: {
    fontSize: 10,
    color: colors.white,
    backgroundColor: colors.primary,
    padding: "4 8",
    borderRadius: 4,
    alignSelf: "flex-start",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: colors.gray,
    width: 120,
  },
  value: {
    fontSize: 11,
    color: colors.dark,
    flex: 1,
  },
  fitScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  fitScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  fitScoreNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
  },
  fitScoreDetails: {
    flex: 1,
  },
  fitLevel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  fitAdjustment: {
    fontSize: 11,
    color: colors.gray,
  },
  insightsList: {
    marginTop: 10,
  },
  insight: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 4,
    paddingLeft: 10,
  },
  pricingTable: {
    marginBottom: 15,
  },
  pricingRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  pricingLayerName: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
    width: 120,
  },
  pricingDescription: {
    fontSize: 10,
    color: colors.gray,
    flex: 1,
  },
  pricingAdjustment: {
    fontSize: 11,
    width: 80,
    textAlign: "right",
  },
  positiveAdjustment: {
    color: colors.success,
  },
  negativeAdjustment: {
    color: colors.danger,
  },
  neutralAdjustment: {
    color: colors.gray,
  },
  totalBox: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  totalValue: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
    paddingTop: 10,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 24,
    color: colors.white,
    fontWeight: "bold",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: colors.gray,
  },
  footerBrand: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "bold",
  },
  validity: {
    fontSize: 9,
    color: colors.gray,
    textAlign: "right",
  },
  formula: {
    fontSize: 8,
    color: colors.gray,
    marginTop: 4,
    textAlign: "right",
  },
  // Pricing model badge styles
  pricingModelBadge: {
    fontSize: 10,
    color: colors.white,
    padding: "4 10",
    borderRadius: 4,
    alignSelf: "flex-start",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  affiliateBadge: {
    backgroundColor: "#8B5CF6", // Purple for affiliate
  },
  hybridBadge: {
    backgroundColor: "#F59E0B", // Amber for hybrid
  },
  performanceBadge: {
    backgroundColor: "#10B981", // Green for performance
  },
  flatFeeBadge: {
    backgroundColor: colors.primary, // Blue for flat fee
  },
  retainerBadge: {
    backgroundColor: "#6366F1", // Indigo for retainer/ambassador
  },
  // Affiliate/Hybrid/Performance breakdown styles
  breakdownBox: {
    backgroundColor: colors.lightGray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 10,
    color: colors.gray,
  },
  breakdownValue: {
    fontSize: 10,
    color: colors.dark,
    fontWeight: "bold",
  },
  breakdownDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.gray,
    marginVertical: 8,
    opacity: 0.3,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.success,
  },
  bonusNote: {
    fontSize: 9,
    color: colors.gray,
    fontStyle: "italic",
    marginTop: 8,
  },
  // Negotiation Talking Points styles
  negotiationPage: {
    flexDirection: "column",
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: "Helvetica",
  },
  negotiationHeader: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.success,
    paddingBottom: 15,
  },
  negotiationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  negotiationSubtitle: {
    fontSize: 11,
    color: colors.gray,
  },
  creatorOnlyBadge: {
    fontSize: 9,
    color: colors.white,
    backgroundColor: colors.warning,
    padding: "3 8",
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
    textTransform: "uppercase",
  },
  negotiationSection: {
    marginBottom: 18,
  },
  negotiationSectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 10,
    color: colors.primary,
    marginRight: 8,
    width: 8,
  },
  bulletText: {
    fontSize: 10,
    color: colors.dark,
    flex: 1,
    lineHeight: 1.4,
  },
  bulletSupporting: {
    fontSize: 9,
    color: colors.gray,
    marginLeft: 16,
    marginBottom: 6,
    fontStyle: "italic",
  },
  confidenceBox: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  confidenceText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.4,
  },
  valueReminder: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
    paddingLeft: 12,
  },
  encouragementBox: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  encouragementText: {
    fontSize: 10,
    color: colors.secondary,
    fontStyle: "italic",
  },
  counterOfferBox: {
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  counterOfferScenario: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
    fontWeight: "bold",
  },
  counterOfferScript: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.4,
  },
  counterOfferMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  counterOfferConcession: {
    fontSize: 8,
    color: colors.warning,
  },
  counterOfferRate: {
    fontSize: 8,
    color: colors.success,
    fontWeight: "bold",
  },
  minimumRateBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  minimumRateText: {
    fontSize: 10,
    color: colors.danger,
    fontWeight: "bold",
  },
  walkAwayText: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 6,
    lineHeight: 1.4,
  },
  leversList: {
    marginTop: 8,
  },
  leverItem: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 3,
    paddingLeft: 12,
  },
  responseBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  responseText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  copyHint: {
    fontSize: 8,
    color: colors.gray,
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  pageBreak: {
    marginTop: 20,
  },
  // FTC Guidance Page styles
  ftcPage: {
    flexDirection: "column",
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: "Helvetica",
  },
  ftcHeader: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.danger,
    paddingBottom: 15,
  },
  ftcTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  ftcSubtitle: {
    fontSize: 11,
    color: colors.gray,
  },
  ftcWarningBadge: {
    fontSize: 9,
    color: colors.white,
    backgroundColor: colors.danger,
    padding: "3 8",
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
    textTransform: "uppercase",
  },
  ftcSection: {
    marginBottom: 16,
  },
  ftcSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.danger,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ftcSummaryBox: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  ftcSummaryHeadline: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.danger,
    marginBottom: 6,
  },
  ftcSummaryText: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 4,
  },
  ftcChecklistContainer: {
    marginBottom: 15,
  },
  ftcChecklistItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  ftcCheckbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 2,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  ftcChecklistText: {
    fontSize: 10,
    color: colors.dark,
    flex: 1,
  },
  ftcChecklistPriority: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  ftcPriorityCritical: {
    backgroundColor: colors.danger,
    color: colors.white,
  },
  ftcPriorityImportant: {
    backgroundColor: colors.warning,
    color: colors.white,
  },
  ftcPriorityRecommended: {
    backgroundColor: colors.lightGray,
    color: colors.gray,
  },
  ftcPlatformBox: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  ftcPlatformName: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 6,
  },
  ftcPlatformRequired: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 8,
    fontWeight: "bold",
  },
  ftcRecommendationItem: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 3,
    paddingLeft: 8,
  },
  ftcMistakeItem: {
    fontSize: 9,
    color: colors.danger,
    marginBottom: 3,
    paddingLeft: 8,
  },
  ftcAcceptableBox: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  ftcUnacceptableBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  ftcFormatTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ftcFormatItem: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 2,
    paddingLeft: 8,
  },
  ftcAiBox: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: 10,
  },
  ftcAiTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  ftcAiText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
  },
  ftcReminderItem: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
    paddingLeft: 8,
  },
  // Contract Checklist Page styles
  contractPage: {
    flexDirection: "column",
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: "Helvetica",
  },
  contractHeader: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.warning,
    paddingBottom: 15,
  },
  contractTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 11,
    color: colors.gray,
  },
  contractSection: {
    marginBottom: 14,
  },
  contractSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.warning,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contractItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  contractCheckbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 1,
  },
  contractItemContent: {
    flex: 1,
  },
  contractItemTerm: {
    fontSize: 10,
    color: colors.dark,
    fontWeight: "bold",
  },
  contractItemRecommendation: {
    fontSize: 8,
    color: colors.gray,
    marginTop: 2,
  },
  contractPriorityBadge: {
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 6,
    textTransform: "uppercase",
  },
  contractPriorityCritical: {
    backgroundColor: colors.danger,
    color: colors.white,
  },
  contractPriorityImportant: {
    backgroundColor: colors.warning,
    color: colors.white,
  },
  contractPriorityRecommended: {
    backgroundColor: colors.lightGray,
    color: colors.gray,
  },
  redFlagSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  redFlagTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.danger,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  redFlagItem: {
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  redFlagText: {
    fontSize: 9,
    color: colors.danger,
    fontWeight: "bold",
    marginBottom: 2,
  },
  redFlagAction: {
    fontSize: 8,
    color: colors.gray,
  },
  redFlagSeverity: {
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  severityHigh: {
    backgroundColor: colors.danger,
    color: colors.white,
  },
  severityMedium: {
    backgroundColor: colors.warning,
    color: colors.white,
  },
  severityLow: {
    backgroundColor: colors.lightGray,
    color: colors.gray,
  },
  dealNotesBox: {
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  dealNoteText: {
    fontSize: 9,
    color: colors.dark,
    marginBottom: 4,
  },
});

interface RateCardDocumentProps {
  profile: CreatorProfile;
  brief: ParsedBrief;
  fitScore: FitScoreResult;
  pricing: PricingResult;
  /** Export mode: "brand" = rate card only, "creator" = rate card + negotiation tips */
  exportMode?: PDFExportMode;
}

/**
 * React-PDF document component for generating professional rate cards.
 * Used by the /api/generate-pdf endpoint.
 */
export function RateCardDocument({
  profile,
  brief,
  fitScore,
  pricing,
  exportMode = "creator", // Default to creator mode (includes negotiation tips)
}: RateCardDocumentProps): React.ReactElement<DocumentProps> {
  const fitColor = fitLevelColors[fitScore.fitLevel] || colors.gray;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + pricing.validDays);

  // Generate negotiation talking points if in creator mode
  const negotiationTips = exportMode === "creator"
    ? generateNegotiationTalkingPoints(pricing, profile, brief)
    : null;

  // Generate FTC guidance if in creator mode
  const ftcGuidance = exportMode === "creator"
    ? getFTCGuidance(
        brief.content.platform,
        getCompensationType(
          brief.dealType,
          false, // hasGift - could be derived from brief if available
          brief.pricingModel === "affiliate" || brief.pricingModel === "hybrid"
        ),
        false // hasAIContent - could be a future brief field
      )
    : null;

  // Generate contract checklist if in creator mode
  const contractChecklist = exportMode === "creator"
    ? getContractChecklist(brief)
    : null;

  // Helper to get priority style for FTC checklist items
  const getPriorityStyle = (priority: "critical" | "important" | "recommended") => {
    switch (priority) {
      case "critical":
        return styles.ftcPriorityCritical;
      case "important":
        return styles.ftcPriorityImportant;
      default:
        return styles.ftcPriorityRecommended;
    }
  };

  // Helper to get priority style for contract checklist items
  const getContractPriorityStyle = (priority: "critical" | "important" | "recommended") => {
    switch (priority) {
      case "critical":
        return styles.contractPriorityCritical;
      case "important":
        return styles.contractPriorityImportant;
      default:
        return styles.contractPriorityRecommended;
    }
  };

  // Helper to get severity style for red flags
  const getSeverityStyle = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return styles.severityHigh;
      case "medium":
        return styles.severityMedium;
      default:
        return styles.severityLow;
    }
  };

  const formatAdjustment = (adjustment: number): string => {
    if (adjustment === 0) return "—";
    const sign = adjustment > 0 ? "+" : "";
    return `${sign}${(adjustment * 100).toFixed(0)}%`;
  };

  const getAdjustmentStyle = (adjustment: number) => {
    if (adjustment > 0) return styles.positiveAdjustment;
    if (adjustment < 0) return styles.negativeAdjustment;
    return styles.neutralAdjustment;
  };

  // Get pricing model display info
  const getPricingModelBadge = (model?: PricingModel) => {
    // Check for retainer first (indicated by retainerBreakdown presence)
    if (pricing.retainerBreakdown) {
      const dealLength = pricing.retainerBreakdown.dealLength;
      if (dealLength === "12_month") {
        return { label: "Ambassador Deal", style: styles.retainerBadge };
      }
      return { label: "Retainer Deal", style: styles.retainerBadge };
    }

    switch (model) {
      case "affiliate":
        return { label: "Affiliate Deal", style: styles.affiliateBadge };
      case "hybrid":
        return { label: "Hybrid Deal", style: styles.hybridBadge };
      case "performance":
        return { label: "Performance Deal", style: styles.performanceBadge };
      default:
        return { label: "Flat Fee", style: styles.flatFeeBadge };
    }
  };

  const pricingModelInfo = getPricingModelBadge(pricing.pricingModel);

  // Render affiliate breakdown section
  const renderAffiliateBreakdown = () => {
    if (!pricing.affiliateBreakdown) return null;
    const { commissionRate, estimatedSales, averageOrderValue, estimatedEarnings, categoryRateRange } = pricing.affiliateBreakdown;

    return (
      <View style={styles.breakdownBox}>
        <Text style={styles.breakdownTitle}>Affiliate Earnings Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Commission Rate</Text>
          <Text style={styles.breakdownValue}>{commissionRate}%</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Estimated Sales</Text>
          <Text style={styles.breakdownValue}>{estimatedSales.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Average Order Value</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{averageOrderValue}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Estimated Earnings</Text>
          <Text style={styles.highlightValue}>{pricing.currencySymbol}{estimatedEarnings.toLocaleString()}</Text>
        </View>
        {categoryRateRange && (
          <Text style={styles.bonusNote}>
            Industry typical: {categoryRateRange.min}%-{categoryRateRange.max}% commission
          </Text>
        )}
      </View>
    );
  };

  // Render hybrid breakdown section
  const renderHybridBreakdown = () => {
    if (!pricing.hybridBreakdown) return null;
    const { baseFee, fullRate, baseDiscount, affiliateEarnings, combinedEstimate } = pricing.hybridBreakdown;

    return (
      <View style={styles.breakdownBox}>
        <Text style={styles.breakdownTitle}>Hybrid Deal Structure</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Standard Rate</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{fullRate.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Hybrid Discount</Text>
          <Text style={styles.breakdownValue}>-{baseDiscount}%</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Guaranteed Base Fee</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{baseFee.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>+ Commission ({affiliateEarnings.commissionRate}%)</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{affiliateEarnings.estimatedEarnings.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Combined Estimate</Text>
          <Text style={styles.highlightValue}>{pricing.currencySymbol}{combinedEstimate.toLocaleString()}</Text>
        </View>
        <Text style={styles.bonusNote}>
          Base fee guaranteed; commission based on {affiliateEarnings.estimatedSales} est. sales
        </Text>
      </View>
    );
  };

  // Render performance breakdown section
  const renderPerformanceBreakdown = () => {
    if (!pricing.performanceBreakdown) return null;
    const { baseFee, bonusThreshold, bonusMetric, bonusAmount, potentialTotal } = pricing.performanceBreakdown;

    return (
      <View style={styles.breakdownBox}>
        <Text style={styles.breakdownTitle}>Performance Deal Structure</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Guaranteed Base Fee</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{baseFee.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Performance Bonus</Text>
          <Text style={styles.breakdownValue}>+{pricing.currencySymbol}{bonusAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Threshold</Text>
          <Text style={styles.breakdownValue}>{bonusThreshold.toLocaleString()} {bonusMetric}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Potential Total</Text>
          <Text style={styles.highlightValue}>{pricing.currencySymbol}{potentialTotal.toLocaleString()}</Text>
        </View>
        <Text style={styles.bonusNote}>
          Bonus paid when {bonusThreshold.toLocaleString()} {bonusMetric} milestone is reached
        </Text>
      </View>
    );
  };

  // Render retainer breakdown section
  const renderRetainerBreakdown = () => {
    if (!pricing.retainerBreakdown) return null;
    const {
      dealLength,
      contractMonths,
      volumeDiscount,
      discountedRates,
      monthlyDeliverables,
      monthlyRate,
      monthlySavings,
      totalContractValue,
      ambassadorBreakdown,
    } = pricing.retainerBreakdown;

    const dealLengthLabel = dealLength === "12_month" ? "12-Month Ambassador" :
      dealLength === "6_month" ? "6-Month Retainer" :
      dealLength === "3_month" ? "3-Month Retainer" : "Monthly Retainer";

    return (
      <View style={styles.breakdownBox}>
        <Text style={styles.breakdownTitle}>{dealLengthLabel} Structure</Text>

        {/* Per-deliverable rates */}
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Post Rate</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{discountedRates.postRate}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Story Rate</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{discountedRates.storyRate}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Reel Rate</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{discountedRates.reelRate}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Video Rate</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{discountedRates.videoRate}</Text>
        </View>

        <View style={styles.breakdownDivider} />

        {/* Monthly deliverables */}
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Monthly Deliverables</Text>
          <Text style={styles.breakdownValue}>
            {monthlyDeliverables.posts} posts, {monthlyDeliverables.stories} stories, {monthlyDeliverables.reels} reels, {monthlyDeliverables.videos} videos
          </Text>
        </View>

        {/* Volume discount */}
        {volumeDiscount > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Volume Discount</Text>
            <Text style={[styles.breakdownValue, { color: colors.success }]}>-{volumeDiscount}%</Text>
          </View>
        )}

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Monthly Savings</Text>
          <Text style={[styles.breakdownValue, { color: colors.success }]}>{pricing.currencySymbol}{monthlySavings.toLocaleString()}</Text>
        </View>

        <View style={styles.breakdownDivider} />

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Monthly Rate</Text>
          <Text style={styles.breakdownValue}>{pricing.currencySymbol}{monthlyRate.toLocaleString()}/mo</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Contract Length</Text>
          <Text style={styles.breakdownValue}>{contractMonths} months</Text>
        </View>

        {/* Ambassador perks */}
        {ambassadorBreakdown && (ambassadorBreakdown.exclusivityPremium > 0 || ambassadorBreakdown.eventsIncluded > 0) && (
          <>
            <View style={styles.breakdownDivider} />
            <Text style={[styles.breakdownLabel, { marginBottom: 6, fontWeight: "bold" }]}>Ambassador Perks</Text>

            {ambassadorBreakdown.exclusivityPremium > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{ambassadorBreakdown.exclusivityType === "full" ? "Full" : "Category"} Exclusivity</Text>
                <Text style={styles.breakdownValue}>+{pricing.currencySymbol}{ambassadorBreakdown.exclusivityPremium.toLocaleString()}</Text>
              </View>
            )}

            {ambassadorBreakdown.eventsIncluded > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{ambassadorBreakdown.eventsIncluded} Event{ambassadorBreakdown.eventsIncluded > 1 ? 's' : ''} ({pricing.currencySymbol}{ambassadorBreakdown.eventDayRate}/day)</Text>
                <Text style={styles.breakdownValue}>+{pricing.currencySymbol}{ambassadorBreakdown.eventAppearancesValue.toLocaleString()}</Text>
              </View>
            )}

            {ambassadorBreakdown.productSeedingValue > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Product Seeding Value</Text>
                <Text style={styles.breakdownValue}>{pricing.currencySymbol}{ambassadorBreakdown.productSeedingValue.toLocaleString()}</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.breakdownDivider} />

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Total Contract Value</Text>
          <Text style={styles.highlightValue}>{pricing.currencySymbol}{totalContractValue.toLocaleString()}</Text>
        </View>

        <Text style={styles.bonusNote}>
          {volumeDiscount > 0 ? `${volumeDiscount}% volume discount applied for ${contractMonths}-month commitment` : 'Month-to-month flexibility, no volume discount'}
        </Text>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.creatorName}>{profile.displayName}</Text>
          <Text style={styles.handle}>@{profile.handle}</Text>
          <Text style={styles.tierBadge}>{profile.tier} Creator</Text>
        </View>

        {/* Creator Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creator Profile</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Reach</Text>
            <Text style={styles.value}>
              {profile.totalReach.toLocaleString()} followers
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Engagement Rate</Text>
            <Text style={styles.value}>{profile.avgEngagementRate}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Niches</Text>
            <Text style={styles.value}>{profile.niches.join(", ")}</Text>
          </View>
          {profile.location && (
            <View style={styles.row}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{profile.location}</Text>
            </View>
          )}
        </View>

        {/* Campaign Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaign Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Brand</Text>
            <Text style={styles.value}>{brief.brand.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Industry</Text>
            <Text style={styles.value}>{brief.brand.industry}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Platform</Text>
            <Text style={styles.value}>
              {brief.content.platform.charAt(0).toUpperCase() +
                brief.content.platform.slice(1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Format</Text>
            <Text style={styles.value}>
              {brief.content.format.charAt(0).toUpperCase() +
                brief.content.format.slice(1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.value}>
              {brief.content.quantity} deliverable
              {brief.content.quantity > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Fit Score Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brand-Creator Fit</Text>
          <View style={styles.fitScoreContainer}>
            <View
              style={[styles.fitScoreCircle, { backgroundColor: fitColor }]}
            >
              <Text style={styles.fitScoreNumber}>{fitScore.totalScore}</Text>
            </View>
            <View style={styles.fitScoreDetails}>
              <Text style={[styles.fitLevel, { color: fitColor }]}>
                {fitScore.fitLevel.charAt(0).toUpperCase() +
                  fitScore.fitLevel.slice(1)}{" "}
                Fit
              </Text>
              <Text style={styles.fitAdjustment}>
                Price adjustment:{" "}
                {fitScore.priceAdjustment > 0 ? "+" : ""}
                {(fitScore.priceAdjustment * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
          {fitScore.insights.length > 0 && (
            <View style={styles.insightsList}>
              {fitScore.insights.slice(0, 3).map((insight, index) => (
                <Text key={index} style={styles.insight}>
                  • {insight}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Breakdown</Text>

          {/* Pricing Model Badge */}
          <Text style={[styles.pricingModelBadge, pricingModelInfo.style]}>
            {pricingModelInfo.label}
          </Text>

          {/* Model-specific breakdown sections */}
          {pricing.pricingModel === "affiliate" && renderAffiliateBreakdown()}
          {pricing.pricingModel === "hybrid" && renderHybridBreakdown()}
          {pricing.pricingModel === "performance" && renderPerformanceBreakdown()}
          {pricing.retainerBreakdown && renderRetainerBreakdown()}

          {/* Standard pricing layers table - show for flat_fee, hybrid, and performance (not affiliate or retainer) */}
          {pricing.pricingModel !== "affiliate" && !pricing.retainerBreakdown && (
            <View style={styles.pricingTable}>
              {pricing.layers.map((layer, index) => (
                <View key={index} style={styles.pricingRow}>
                  <Text style={styles.pricingLayerName}>{layer.name}</Text>
                  <Text style={styles.pricingDescription}>
                    {layer.description}
                  </Text>
                  <Text
                    style={[
                      styles.pricingAdjustment,
                      getAdjustmentStyle(layer.multiplier - 1),
                    ]}
                  >
                    {formatAdjustment(layer.multiplier - 1)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Total Box - different layouts per pricing model */}
        <View style={styles.totalBox}>
          {pricing.pricingModel === "affiliate" ? (
            /* Affiliate: Show estimated earnings */
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Commission Rate</Text>
                <Text style={styles.totalValue}>
                  {pricing.affiliateBreakdown?.commissionRate}%
                </Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Estimated Earnings</Text>
                <Text style={styles.grandTotalValue}>
                  {pricing.currencySymbol}{pricing.totalPrice.toLocaleString()} {pricing.currency}
                </Text>
              </View>
            </>
          ) : pricing.pricingModel === "hybrid" ? (
            /* Hybrid: Show base + commission = combined */
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Guaranteed Base</Text>
                <Text style={styles.totalValue}>
                  {pricing.currencySymbol}{pricing.hybridBreakdown?.baseFee.toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>+ Est. Commission</Text>
                <Text style={styles.totalValue}>
                  {pricing.currencySymbol}{pricing.hybridBreakdown?.affiliateEarnings.estimatedEarnings.toLocaleString()}
                </Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Combined Estimate</Text>
                <Text style={styles.grandTotalValue}>
                  {pricing.currencySymbol}{pricing.totalPrice.toLocaleString()} {pricing.currency}
                </Text>
              </View>
            </>
          ) : pricing.pricingModel === "performance" ? (
            /* Performance: Show base + potential bonus */
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Guaranteed Base</Text>
                <Text style={styles.totalValue}>
                  {pricing.currencySymbol}{pricing.totalPrice.toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Potential Bonus</Text>
                <Text style={styles.totalValue}>
                  +{pricing.currencySymbol}{pricing.performanceBreakdown?.bonusAmount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Potential Total</Text>
                <Text style={styles.grandTotalValue}>
                  {pricing.currencySymbol}{pricing.performanceBreakdown?.potentialTotal.toLocaleString()} {pricing.currency}
                </Text>
              </View>
            </>
          ) : pricing.retainerBreakdown ? (
            /* Retainer/Ambassador: Show monthly rate and total contract */
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Monthly Rate</Text>
                <Text style={styles.totalValue}>
                  {pricing.currencySymbol}{pricing.retainerBreakdown.monthlyRate.toLocaleString()}/mo
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Contract Length</Text>
                <Text style={styles.totalValue}>
                  {pricing.retainerBreakdown.contractMonths} months
                </Text>
              </View>
              {pricing.retainerBreakdown.ambassadorBreakdown && pricing.retainerBreakdown.ambassadorBreakdown.totalPerksValue > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Ambassador Perks</Text>
                  <Text style={styles.totalValue}>
                    +{pricing.currencySymbol}{pricing.retainerBreakdown.ambassadorBreakdown.totalPerksValue.toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Total Contract Value</Text>
                <Text style={styles.grandTotalValue}>
                  {pricing.currencySymbol}{pricing.totalPrice.toLocaleString()} {pricing.currency}
                </Text>
              </View>
            </>
          ) : (
            /* Flat Fee: Standard layout */
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Per Deliverable</Text>
                <Text style={styles.totalValue}>
                  {pricing.currencySymbol}{pricing.pricePerDeliverable.toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Quantity</Text>
                <Text style={styles.totalValue}>×{pricing.quantity}</Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Total Quote</Text>
                <Text style={styles.grandTotalValue}>
                  {pricing.currencySymbol}{pricing.totalPrice.toLocaleString()} {pricing.currency}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerBrand}>RateCard.AI</Text>
            <Text style={styles.footerText}>
              Data-backed rates for content creators
            </Text>
          </View>
          <View>
            <Text style={styles.validity}>
              Valid for {pricing.validDays} days
            </Text>
            <Text style={styles.validity}>
              Expires: {expiryDate.toLocaleDateString()}
            </Text>
            <Text style={styles.formula}>Formula: {pricing.formula}</Text>
          </View>
        </View>
      </Page>

      {/* Negotiation Talking Points Pages - Only in Creator Mode */}
      {negotiationTips && (
        <>
          {/* Page 2: Why This Rate + Confidence Boosters */}
          <Page size="A4" style={styles.negotiationPage}>
            {/* Header */}
            <View style={styles.negotiationHeader}>
              <Text style={styles.negotiationTitle}>Negotiation Confidence Stack</Text>
              <Text style={styles.negotiationSubtitle}>
                Your guide to confidently presenting and defending your rate
              </Text>
              <Text style={styles.creatorOnlyBadge}>For Your Eyes Only</Text>
            </View>

            {/* Section 1: Why This Rate */}
            <View style={styles.negotiationSection}>
              <Text style={styles.negotiationSectionTitle}>Why This Rate</Text>
              <Text style={[styles.bulletSupporting, { marginLeft: 0, marginBottom: 10 }]}>
                Share these points with brands to justify your rate
              </Text>
              {negotiationTips.whyThisRate.bulletPoints.map((point, index) => (
                <View key={index}>
                  <View style={styles.bulletPoint}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{point.point}</Text>
                  </View>
                  {point.supporting && (
                    <Text style={styles.bulletSupporting}>{point.supporting}</Text>
                  )}
                </View>
              ))}
              <View style={styles.encouragementBox}>
                <Text style={styles.confidenceText}>{negotiationTips.whyThisRate.summary}</Text>
              </View>
            </View>

            {/* Section 2: Confidence Boosters */}
            <View style={styles.negotiationSection}>
              <Text style={styles.negotiationSectionTitle}>Confidence Boosters</Text>
              <Text style={[styles.bulletSupporting, { marginLeft: 0, marginBottom: 10 }]}>
                {"Internal reminders - don't share with brands"}
              </Text>

              {/* Market Comparison */}
              <View style={styles.confidenceBox}>
                <Text style={styles.confidenceText}>{negotiationTips.confidenceBoosters.marketComparison}</Text>
              </View>

              {/* Value Reminders */}
              <View style={styles.leversList}>
                {negotiationTips.confidenceBoosters.valueReminders.map((reminder, index) => (
                  <Text key={index} style={styles.valueReminder}>✓ {reminder}</Text>
                ))}
              </View>

              {/* Encouragement */}
              <View style={styles.encouragementBox}>
                <Text style={styles.encouragementText}>{negotiationTips.confidenceBoosters.encouragement}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View>
                <Text style={styles.footerBrand}>RateCard.AI</Text>
                <Text style={styles.footerText}>Confidence Stack - Page 2</Text>
              </View>
              <View>
                <Text style={styles.validity}>{"For creator's reference only"}</Text>
              </View>
            </View>
          </Page>

          {/* Page 3: If They Push Back + Quick Response */}
          <Page size="A4" style={styles.negotiationPage}>
            {/* Header */}
            <View style={styles.negotiationHeader}>
              <Text style={styles.negotiationTitle}>If They Push Back</Text>
              <Text style={styles.negotiationSubtitle}>
                Scripts and strategies for common negotiation scenarios
              </Text>
              <Text style={styles.creatorOnlyBadge}>For Your Eyes Only</Text>
            </View>

            {/* Section 3: Counter-Offer Scripts */}
            <View style={styles.negotiationSection}>
              <Text style={styles.negotiationSectionTitle}>Counter-Offer Scripts</Text>
              {negotiationTips.pushBack.counterOfferScripts.map((script, index) => (
                <View key={index} style={styles.counterOfferBox}>
                  <Text style={styles.counterOfferScenario}>{script.scenario}</Text>
                  <Text style={styles.counterOfferScript}>{script.script}</Text>
                  {(script.concession || script.adjustedRate) && (
                    <View style={styles.counterOfferMeta}>
                      {script.concession && (
                        <Text style={styles.counterOfferConcession}>Concession: {script.concession}</Text>
                      )}
                      {script.adjustedRate && (
                        <Text style={styles.counterOfferRate}>Adjusted: {script.adjustedRate}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}

              {/* Negotiation Levers */}
              <Text style={[styles.negotiationSectionTitle, { fontSize: 11, marginTop: 10 }]}>
                Things You Can Reduce to Meet Budget
              </Text>
              <View style={styles.leversList}>
                {negotiationTips.pushBack.negotiationLevers.slice(0, 4).map((lever, index) => (
                  <Text key={index} style={styles.leverItem}>• {lever}</Text>
                ))}
              </View>

              {/* Minimum Rate & Walk Away */}
              <View style={styles.minimumRateBox}>
                <Text style={styles.minimumRateText}>
                  Minimum Acceptable: {pricing.currencySymbol}{negotiationTips.pushBack.minimumRate.toLocaleString()} ({negotiationTips.pushBack.minimumRatePercentage}% of quoted rate)
                </Text>
                <Text style={styles.walkAwayText}>{negotiationTips.pushBack.walkAwayPoint}</Text>
              </View>
            </View>

            {/* Section 4: Quick Response Template */}
            <View style={styles.negotiationSection}>
              <Text style={styles.negotiationSectionTitle}>Quick Response Template</Text>
              <Text style={[styles.bulletSupporting, { marginLeft: 0, marginBottom: 10 }]}>
                Copy and customize this message to send to the brand
              </Text>
              <View style={styles.responseBox}>
                <Text style={styles.responseText}>{negotiationTips.quickResponse.fullMessage}</Text>
              </View>
              <Text style={styles.copyHint}>Copy this message and personalize before sending</Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View>
                <Text style={styles.footerBrand}>RateCard.AI</Text>
                <Text style={styles.footerText}>Confidence Stack - Page 3</Text>
              </View>
              <View>
                <Text style={styles.validity}>{"For creator's reference only"}</Text>
              </View>
            </View>
          </Page>
        </>
      )}

      {/* FTC Disclosure Guidance Page - Only in Creator Mode */}
      {ftcGuidance && (
        <Page size="A4" style={styles.ftcPage}>
          {/* Header */}
          <View style={styles.ftcHeader}>
            <Text style={styles.ftcTitle}>FTC Disclosure Guide</Text>
            <Text style={styles.ftcSubtitle}>
              Stay compliant and avoid penalties up to $50,000+ per violation
            </Text>
            <Text style={styles.ftcWarningBadge}>Required Reading</Text>
          </View>

          {/* Quick Summary Box */}
          <View style={styles.ftcSummaryBox}>
            <Text style={styles.ftcSummaryHeadline}>{ftcGuidance.summary.headline}</Text>
            <Text style={styles.ftcSummaryText}>
              Required: {ftcGuidance.summary.requiredText}
            </Text>
            <Text style={styles.ftcSummaryText}>
              Placement: {ftcGuidance.summary.placement}
            </Text>
          </View>

          {/* Compliance Checklist */}
          <View style={styles.ftcSection}>
            <Text style={styles.ftcSectionTitle}>Compliance Checklist</Text>
            <View style={styles.ftcChecklistContainer}>
              {ftcGuidance.checklist.map((item, index) => (
                <View key={index} style={styles.ftcChecklistItem}>
                  <View style={styles.ftcCheckbox}>
                    <Text style={{ fontSize: 8, color: colors.gray }}>☐</Text>
                  </View>
                  <Text style={styles.ftcChecklistText}>{item.text}</Text>
                  <Text style={[styles.ftcChecklistPriority, getPriorityStyle(item.priority)]}>
                    {item.priority}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Platform-Specific Guidance */}
          <View style={styles.ftcSection}>
            <Text style={styles.ftcSectionTitle}>
              {ftcGuidance.platformGuidance.platformName} Guidelines
            </Text>
            <View style={styles.ftcPlatformBox}>
              <Text style={styles.ftcPlatformRequired}>
                Required: {ftcGuidance.platformGuidance.requiredDisclosure}
              </Text>
              {ftcGuidance.platformGuidance.builtInTools.length > 0 && (
                <>
                  <Text style={[styles.ftcFormatTitle, { color: colors.primary }]}>
                    Built-in Tools:
                  </Text>
                  {ftcGuidance.platformGuidance.builtInTools.map((tool, index) => (
                    <Text key={index} style={styles.ftcRecommendationItem}>
                      • {tool}
                    </Text>
                  ))}
                </>
              )}
              <Text style={[styles.ftcFormatTitle, { color: colors.success, marginTop: 8 }]}>
                Recommendations:
              </Text>
              {ftcGuidance.platformGuidance.recommendations.slice(0, 4).map((rec, index) => (
                <Text key={index} style={styles.ftcRecommendationItem}>
                  ✓ {rec}
                </Text>
              ))}
            </View>
          </View>

          {/* Common Mistakes to Avoid */}
          <View style={styles.ftcSection}>
            <Text style={styles.ftcSectionTitle}>Common Mistakes to Avoid</Text>
            {ftcGuidance.platformGuidance.mistakes.map((mistake, index) => (
              <Text key={index} style={styles.ftcMistakeItem}>
                ✗ {mistake}
              </Text>
            ))}
          </View>

          {/* Acceptable vs Unacceptable Formats */}
          <View style={styles.ftcSection}>
            <Text style={styles.ftcSectionTitle}>Disclosure Formats</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[styles.ftcAcceptableBox, { flex: 1 }]}>
                <Text style={[styles.ftcFormatTitle, { color: colors.success }]}>
                  ✓ Acceptable
                </Text>
                {ftcGuidance.contentRules.acceptableFormats.slice(0, 4).map((format, index) => (
                  <Text key={index} style={styles.ftcFormatItem}>
                    • {format}
                  </Text>
                ))}
              </View>
              <View style={[styles.ftcUnacceptableBox, { flex: 1 }]}>
                <Text style={[styles.ftcFormatTitle, { color: colors.danger }]}>
                  ✗ Not Acceptable
                </Text>
                {ftcGuidance.contentRules.unacceptableFormats.slice(0, 4).map((format, index) => (
                  <Text key={index} style={styles.ftcFormatItem}>
                    • {format}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* AI Disclosure Note (if applicable) */}
          {ftcGuidance.aiDisclosure && (
            <View style={styles.ftcAiBox}>
              <Text style={styles.ftcAiTitle}>AI Content Disclosure (2025 Guidance)</Text>
              <Text style={styles.ftcAiText}>{ftcGuidance.aiDisclosure.explanation}</Text>
              <Text style={[styles.ftcAiText, { marginTop: 4, fontWeight: "bold" }]}>
                {`Suggested text: "${ftcGuidance.aiDisclosure.suggestedText}"`}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerBrand}>RateCard.AI</Text>
              <Text style={styles.footerText}>FTC Disclosure Guide</Text>
            </View>
            <View>
              <Text style={styles.validity}>Not legal advice - consult an attorney for specific situations</Text>
            </View>
          </View>
        </Page>
      )}

      {/* Contract Terms Checklist Page - Only in Creator Mode */}
      {contractChecklist && (
        <Page size="A4" style={styles.contractPage}>
          {/* Header */}
          <View style={styles.contractHeader}>
            <Text style={styles.contractTitle}>Contract Terms Checklist</Text>
            <Text style={styles.contractSubtitle}>
              Essential terms to look for before signing any brand deal
            </Text>
          </View>

          {/* Deal-Specific Notes */}
          {contractChecklist.dealNotes.length > 0 && (
            <View style={styles.dealNotesBox}>
              {contractChecklist.dealNotes.map((note, index) => (
                <Text key={index} style={styles.dealNoteText}>
                  • {note}
                </Text>
              ))}
            </View>
          )}

          {/* Payment Terms Section */}
          <View style={styles.contractSection}>
            <Text style={styles.contractSectionTitle}>💰 Payment Terms</Text>
            {contractChecklist.items
              .filter((item) => item.category === "payment")
              .map((item, index) => (
                <View key={index} style={styles.contractItem}>
                  <View style={styles.contractCheckbox} />
                  <View style={styles.contractItemContent}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.contractItemTerm}>{item.term}</Text>
                      <Text style={[styles.contractPriorityBadge, getContractPriorityStyle(item.priority)]}>
                        {item.priority}
                      </Text>
                    </View>
                    <Text style={styles.contractItemRecommendation}>
                      Recommended: {item.recommendation}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Content & Rights Section */}
          <View style={styles.contractSection}>
            <Text style={styles.contractSectionTitle}>📝 Content & Rights</Text>
            {contractChecklist.items
              .filter((item) => item.category === "content_rights")
              .map((item, index) => (
                <View key={index} style={styles.contractItem}>
                  <View style={styles.contractCheckbox} />
                  <View style={styles.contractItemContent}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.contractItemTerm}>{item.term}</Text>
                      <Text style={[styles.contractPriorityBadge, getContractPriorityStyle(item.priority)]}>
                        {item.priority}
                      </Text>
                    </View>
                    <Text style={styles.contractItemRecommendation}>
                      Recommended: {item.recommendation}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Exclusivity Section */}
          <View style={styles.contractSection}>
            <Text style={styles.contractSectionTitle}>🔒 Exclusivity</Text>
            {contractChecklist.items
              .filter((item) => item.category === "exclusivity")
              .map((item, index) => (
                <View key={index} style={styles.contractItem}>
                  <View style={styles.contractCheckbox} />
                  <View style={styles.contractItemContent}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.contractItemTerm}>{item.term}</Text>
                      <Text style={[styles.contractPriorityBadge, getContractPriorityStyle(item.priority)]}>
                        {item.priority}
                      </Text>
                    </View>
                    <Text style={styles.contractItemRecommendation}>
                      Recommended: {item.recommendation}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Legal Section */}
          <View style={styles.contractSection}>
            <Text style={styles.contractSectionTitle}>⚖️ Legal Protection</Text>
            {contractChecklist.items
              .filter((item) => item.category === "legal")
              .map((item, index) => (
                <View key={index} style={styles.contractItem}>
                  <View style={styles.contractCheckbox} />
                  <View style={styles.contractItemContent}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.contractItemTerm}>{item.term}</Text>
                      <Text style={[styles.contractPriorityBadge, getContractPriorityStyle(item.priority)]}>
                        {item.priority}
                      </Text>
                    </View>
                    <Text style={styles.contractItemRecommendation}>
                      Recommended: {item.recommendation}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerBrand}>RateCard.AI</Text>
              <Text style={styles.footerText}>Contract Checklist - Page 1</Text>
            </View>
            <View>
              <Text style={styles.validity}>Not legal advice - consult an attorney</Text>
            </View>
          </View>
        </Page>
      )}

      {/* Contract Red Flags Page - Only in Creator Mode */}
      {contractChecklist && contractChecklist.redFlags.length > 0 && (
        <Page size="A4" style={styles.contractPage}>
          {/* Header */}
          <View style={[styles.contractHeader, { borderBottomColor: colors.danger }]}>
            <Text style={[styles.contractTitle, { color: colors.danger }]}>🚩 Contract Red Flags</Text>
            <Text style={styles.contractSubtitle}>
              Warning signs to watch for - negotiate or walk away
            </Text>
          </View>

          {/* High Severity Red Flags */}
          <View style={styles.redFlagSection}>
            <Text style={styles.redFlagTitle}>High Risk - Negotiate or Decline</Text>
            {contractChecklist.redFlags
              .filter((flag) => flag.severity === "high")
              .map((flag, index) => (
                <View key={index} style={styles.redFlagItem}>
                  <Text style={styles.redFlagText}>🚩 {flag.flag}</Text>
                  <Text style={styles.redFlagAction}>Action: {flag.action}</Text>
                  <Text style={[styles.redFlagSeverity, getSeverityStyle(flag.severity)]}>
                    {flag.severity} risk
                  </Text>
                </View>
              ))}
          </View>

          {/* Medium Severity Red Flags */}
          <View style={styles.redFlagSection}>
            <Text style={[styles.redFlagTitle, { color: colors.warning }]}>Medium Risk - Negotiate</Text>
            {contractChecklist.redFlags
              .filter((flag) => flag.severity === "medium")
              .map((flag, index) => (
                <View key={index} style={[styles.redFlagItem, { borderLeftColor: colors.warning }]}>
                  <Text style={[styles.redFlagText, { color: colors.warning }]}>⚠️ {flag.flag}</Text>
                  <Text style={styles.redFlagAction}>Action: {flag.action}</Text>
                  <Text style={[styles.redFlagSeverity, getSeverityStyle(flag.severity)]}>
                    {flag.severity} risk
                  </Text>
                </View>
              ))}
          </View>

          {/* Low Severity Red Flags */}
          {contractChecklist.redFlags.filter((f) => f.severity === "low").length > 0 && (
            <View style={styles.redFlagSection}>
              <Text style={[styles.redFlagTitle, { color: colors.gray }]}>Low Risk - Be Aware</Text>
              {contractChecklist.redFlags
                .filter((flag) => flag.severity === "low")
                .map((flag, index) => (
                  <View key={index} style={[styles.redFlagItem, { borderLeftColor: colors.gray, backgroundColor: colors.lightGray }]}>
                    <Text style={[styles.redFlagText, { color: colors.gray }]}>📌 {flag.flag}</Text>
                    <Text style={styles.redFlagAction}>Action: {flag.action}</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerBrand}>RateCard.AI</Text>
              <Text style={styles.footerText}>Contract Red Flags - Page 2</Text>
            </View>
            <View>
              <Text style={styles.validity}>Not legal advice - consult an attorney</Text>
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}
