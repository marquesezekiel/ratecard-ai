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
} from "./types";

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
});

interface RateCardDocumentProps {
  profile: CreatorProfile;
  brief: ParsedBrief;
  fitScore: FitScoreResult;
  pricing: PricingResult;
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
}: RateCardDocumentProps): React.ReactElement<DocumentProps> {
  const fitColor = fitLevelColors[fitScore.fitLevel] || colors.gray;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + pricing.validDays);

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
        </View>

        {/* Total Box */}
        <View style={styles.totalBox}>
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
    </Document>
  );
}
