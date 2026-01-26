"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  RotateCcw,
  Users,
  Globe,
  Handshake,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Info,
} from "lucide-react";
import type { BrandVettingResult, TrustLevel } from "@/lib/types";

interface BrandVettingResultProps {
  result: BrandVettingResult;
  onReset?: () => void;
}

const CATEGORY_INFO: Record<
  keyof BrandVettingResult["breakdown"],
  { label: string; icon: React.ReactNode; description: string }
> = {
  socialPresence: {
    label: "Social Presence",
    icon: <Users className="h-4 w-4" />,
    description: "Follower count, activity, engagement",
  },
  websiteVerification: {
    label: "Website",
    icon: <Globe className="h-4 w-4" />,
    description: "SSL, domain quality, contact info",
  },
  collaborationHistory: {
    label: "Creator Collabs",
    icon: <Handshake className="h-4 w-4" />,
    description: "Past creator partnerships",
  },
  scamIndicators: {
    label: "Scam Check",
    icon: <ShieldAlert className="h-4 w-4" />,
    description: "Red flags detected (inverse)",
  },
};

function getTrustLevelInfo(level: TrustLevel): {
  label: string;
  bgColor: string;
  textColor: string;
  lightBg: string;
  borderColor: string;
  description: string;
  icon: React.ReactNode;
} {
  switch (level) {
    case "verified":
      return {
        label: "Strong Signals",
        bgColor: "bg-green-500",
        textColor: "text-green-700",
        lightBg: "bg-green-50",
        borderColor: "border-green-200",
        description: "Positive signals detected - proceed with normal diligence",
        icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
      };
    case "likely_legit":
      return {
        label: "Good Signals",
        bgColor: "bg-blue-500",
        textColor: "text-blue-700",
        lightBg: "bg-blue-50",
        borderColor: "border-blue-200",
        description: "Mostly positive signals - verify key details",
        icon: <CheckCircle className="h-5 w-5 text-blue-600" />,
      };
    case "caution":
      return {
        label: "Mixed Signals",
        bgColor: "bg-yellow-500",
        textColor: "text-yellow-700",
        lightBg: "bg-yellow-50",
        borderColor: "border-yellow-200",
        description: "Some concerns detected - ask questions before committing",
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      };
    case "high_risk":
      return {
        label: "Caution Advised",
        bgColor: "bg-red-500",
        textColor: "text-red-700",
        lightBg: "bg-red-50",
        borderColor: "border-red-200",
        description: "Multiple warning signals - research thoroughly before proceeding",
        icon: <XCircle className="h-5 w-5 text-red-600" />,
      };
  }
}

function getScoreColor(score: number, max: number = 25) {
  const percentage = score / max;
  if (percentage >= 0.8) return "text-green-600";
  if (percentage >= 0.6) return "text-blue-600";
  if (percentage >= 0.4) return "text-yellow-600";
  return "text-red-600";
}

function getConfidenceBadge(confidence: "high" | "medium" | "low") {
  switch (confidence) {
    case "high":
      return <Badge variant="outline" className="text-xs text-green-600 border-green-300">High confidence</Badge>;
    case "medium":
      return <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">Medium confidence</Badge>;
    case "low":
      return <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">Low confidence</Badge>;
  }
}

function getSentimentIcon(sentiment: "positive" | "neutral" | "negative") {
  switch (sentiment) {
    case "positive":
      return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
    case "neutral":
      return <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />;
    case "negative":
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
  }
}

function getSeverityBadge(severity: "high" | "medium" | "low") {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
    case "low":
      return <Badge variant="secondary">Low</Badge>;
  }
}

/**
 * Brand Vetting Result Component
 *
 * Displays the analysis results including trust score, category breakdown,
 * findings, red flags, and recommendations.
 */
export function BrandVettingResult({ result, onReset }: BrandVettingResultProps) {
  const [findingsOpen, setFindingsOpen] = useState(false);
  const trustInfo = getTrustLevelInfo(result.trustLevel);

  const categoryEntries = Object.entries(result.breakdown) as [
    keyof BrandVettingResult["breakdown"],
    BrandVettingResult["breakdown"][keyof BrandVettingResult["breakdown"]]
  ][];

  const positiveFindings = result.findings.filter((f) => f.sentiment === "positive");
  const negativeFindings = result.findings.filter((f) => f.sentiment === "negative");
  const neutralFindings = result.findings.filter((f) => f.sentiment === "neutral");

  return (
    <div className="space-y-6">
      {/* Trust Score Card */}
      <Card className={`${trustInfo.lightBg} ${trustInfo.borderColor}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Trust Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Score Circle */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className={trustInfo.textColor}
                    strokeDasharray={`${(result.trustScore / 100) * 226} 226`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${trustInfo.textColor}`}>
                    {result.trustScore}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {trustInfo.icon}
                  <Badge className={`${trustInfo.bgColor} text-white text-sm`}>
                    {trustInfo.label}
                  </Badge>
                </div>
                <p className={`text-sm mt-1 ${trustInfo.textColor}`}>
                  {trustInfo.description}
                </p>
                {result.cached && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Cached result
                  </p>
                )}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Vet Another Brand
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryEntries.map(([key, category]) => {
          const info = CATEGORY_INFO[key];
          return (
            <Card key={key}>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardContent className="pt-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {info.icon}
                        <span className="text-sm font-medium">{info.label}</span>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(category.score)}`}>
                        {category.score}/25
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      {getConfidenceBadge(category.confidence)}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 border-t">
                    <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                    {category.details.length > 0 ? (
                      <ul className="space-y-1">
                        {category.details.map((detail, i) => (
                          <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No details available</p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Red Flags Section */}
      {result.redFlags.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Red Flags ({result.redFlags.length})
            </CardTitle>
            <CardDescription className="text-red-600">
              These concerns should be addressed before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.redFlags.map((flag, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-lg border border-red-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-red-800">{flag.flag}</span>
                  {getSeverityBadge(flag.severity)}
                </div>
                <p className="text-sm text-red-700">{flag.explanation}</p>
                {flag.source && (
                  <p className="text-xs text-red-500">Source: {flag.source}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Findings Section (Collapsible) */}
      {result.findings.length > 0 && (
        <Card>
          <Collapsible open={findingsOpen} onOpenChange={setFindingsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Findings ({result.findings.length})
                    </CardTitle>
                    <CardDescription>
                      Details discovered during research
                    </CardDescription>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${findingsOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                {/* Positive Findings */}
                {positiveFindings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Positive ({positiveFindings.length})
                    </h4>
                    <div className="space-y-2">
                      {positiveFindings.map((finding, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                          {getSentimentIcon(finding.sentiment)}
                          <div>
                            <p className="text-sm text-green-800">{finding.finding}</p>
                            {finding.evidence && (
                              <p className="text-xs text-green-600 mt-1">{finding.evidence}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative Findings */}
                {negativeFindings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Concerns ({negativeFindings.length})
                    </h4>
                    <div className="space-y-2">
                      {negativeFindings.map((finding, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                          {getSentimentIcon(finding.sentiment)}
                          <div>
                            <p className="text-sm text-red-800">{finding.finding}</p>
                            {finding.evidence && (
                              <p className="text-xs text-red-600 mt-1">{finding.evidence}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Neutral Findings */}
                {neutralFindings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      Other ({neutralFindings.length})
                    </h4>
                    <div className="space-y-2">
                      {neutralFindings.map((finding, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                          {getSentimentIcon(finding.sentiment)}
                          <div>
                            <p className="text-sm text-gray-800">{finding.finding}</p>
                            {finding.evidence && (
                              <p className="text-xs text-gray-600 mt-1">{finding.evidence}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Recommendations Section */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Next steps based on our analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Data Sources Note */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                Checked on {new Date(result.checkedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {result.dataSources.length > 0 && (
                <p className="mt-1">
                  Sources: {result.dataSources.join(", ")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
