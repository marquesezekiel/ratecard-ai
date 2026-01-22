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
  Copy,
  RotateCcw,
  DollarSign,
  FileText,
  Lock,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import type { ContractScanResult as ContractScanResultType, ContractScanCategory } from "@/lib/types";

interface ContractScanResultProps {
  result: ContractScanResultType;
  onReset?: () => void;
}

const CATEGORY_INFO: Record<ContractScanCategory, { label: string; icon: React.ReactNode }> = {
  payment: { label: "Payment", icon: <DollarSign className="h-4 w-4" /> },
  contentRights: { label: "Content & Rights", icon: <FileText className="h-4 w-4" /> },
  exclusivity: { label: "Exclusivity", icon: <Lock className="h-4 w-4" /> },
  legal: { label: "Legal", icon: <Scale className="h-4 w-4" /> },
};

function getHealthColor(level: ContractScanResultType["healthLevel"]) {
  switch (level) {
    case "excellent":
      return { bg: "bg-green-500", text: "text-green-700", light: "bg-green-50", border: "border-green-200" };
    case "good":
      return { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-200" };
    case "fair":
      return { bg: "bg-yellow-500", text: "text-yellow-700", light: "bg-yellow-50", border: "border-yellow-200" };
    case "poor":
      return { bg: "bg-red-500", text: "text-red-700", light: "bg-red-50", border: "border-red-200" };
  }
}

function getHealthLabel(level: ContractScanResultType["healthLevel"]) {
  switch (level) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "fair":
      return "Fair";
    case "poor":
      return "Poor";
  }
}

function getCategoryStatusColor(status: "complete" | "partial" | "missing") {
  switch (status) {
    case "complete":
      return "text-green-600";
    case "partial":
      return "text-yellow-600";
    case "missing":
      return "text-red-600";
  }
}

function getAssessmentIcon(assessment: "good" | "concerning" | "red_flag") {
  switch (assessment) {
    case "good":
      return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
    case "concerning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
    case "red_flag":
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
  }
}

function getImportanceBadge(importance: "critical" | "important" | "recommended") {
  switch (importance) {
    case "critical":
      return <Badge variant="destructive">Critical</Badge>;
    case "important":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Important</Badge>;
    case "recommended":
      return <Badge variant="secondary">Recommended</Badge>;
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
 * Contract Scan Result Component
 *
 * Displays the analysis results including health score, category breakdown,
 * found clauses, missing clauses, red flags, and recommendations.
 */
export function ContractScanResult({ result, onReset }: ContractScanResultProps) {
  const [foundClausesOpen, setFoundClausesOpen] = useState(false);
  const colors = getHealthColor(result.healthLevel);

  const handleCopyChangeRequest = () => {
    navigator.clipboard.writeText(result.changeRequestTemplate);
    toast.success("Change request copied to clipboard");
  };

  const categoryEntries = Object.entries(result.categories) as [
    ContractScanCategory,
    (typeof result.categories)[ContractScanCategory]
  ][];

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <Card className={`${colors.light} ${colors.border}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Contract Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
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
                    className={colors.text}
                    strokeDasharray={`${(result.healthScore / 100) * 226} 226`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${colors.text}`}>{result.healthScore}</span>
                </div>
              </div>

              <div>
                <Badge className={`${colors.bg} text-white text-sm`}>
                  {getHealthLabel(result.healthLevel)}
                </Badge>
                <p className={`text-sm mt-1 ${colors.text}`}>
                  {result.healthLevel === "excellent" && "Great contract! Minor tweaks at most."}
                  {result.healthLevel === "good" && "Solid contract with room for improvement."}
                  {result.healthLevel === "fair" && "Several areas need attention before signing."}
                  {result.healthLevel === "poor" && "Significant issues - negotiate or walk away."}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Scan Another
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
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {info.icon}
                    <span className="text-sm font-medium">{info.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${getCategoryStatusColor(category.status)}`}>
                    {category.score}/25
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getCategoryStatusColor(category.status)} border-current`}
                >
                  {category.status === "complete" && "Complete"}
                  {category.status === "partial" && "Partial"}
                  {category.status === "missing" && "Missing"}
                </Badge>
                {category.findings.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {category.findings.slice(0, 2).map((finding, i) => (
                      <li key={i} className="text-xs text-muted-foreground line-clamp-1">
                        {finding}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
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
              These issues should be addressed before signing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.redFlags.map((flag, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-lg border border-red-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-red-800">{flag.clause}</span>
                  {getSeverityBadge(flag.severity)}
                </div>
                {flag.quote && (
                  <p className="text-sm italic text-muted-foreground bg-red-50 p-2 rounded border-l-2 border-red-300">
                    &ldquo;{flag.quote}&rdquo;
                  </p>
                )}
                <p className="text-sm text-red-700">{flag.explanation}</p>
                <p className="text-sm text-red-900 font-medium">
                  Suggestion: {flag.suggestion}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Missing Clauses Section */}
      {result.missingClauses.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Missing Clauses ({result.missingClauses.length})
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Important terms not found in the contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.missingClauses.map((clause, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-yellow-900">{clause.item}</span>
                      {getImportanceBadge(clause.importance)}
                    </div>
                    <p className="text-sm text-yellow-800">{clause.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Found Clauses Section (Collapsible) */}
      {result.foundClauses.length > 0 && (
        <Card>
          <Collapsible open={foundClausesOpen} onOpenChange={setFoundClausesOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Found Clauses ({result.foundClauses.length})
                    </CardTitle>
                    <CardDescription>
                      Terms and clauses identified in your contract
                    </CardDescription>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${foundClausesOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                {result.foundClauses.map((clause, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    {getAssessmentIcon(clause.assessment)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{clause.item}</span>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_INFO[clause.category].label}
                        </Badge>
                      </div>
                      <p className="text-sm italic text-muted-foreground">
                        &ldquo;{clause.quote}&rdquo;
                      </p>
                      {clause.note && (
                        <p className="text-sm text-foreground mt-1">{clause.note}</p>
                      )}
                    </div>
                  </div>
                ))}
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
              Suggested actions to improve this contract
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

      {/* Copy Change Request Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="font-medium">Ready to Negotiate?</h3>
              <p className="text-sm text-muted-foreground">
                Copy a pre-written change request email to send to the brand
              </p>
            </div>
            <Button onClick={handleCopyChangeRequest} className="w-full sm:w-auto">
              <Copy className="h-4 w-4 mr-2" />
              Copy Change Request Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
