"use client";

import { useState } from "react";
import { FileText, AlertTriangle } from "lucide-react";
import { ContractScannerForm } from "@/components/forms/contract-scanner-form";
import { ContractScanResult } from "@/components/contract-scan-result";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { ContractScanResult as ContractScanResultType } from "@/lib/types";

const breadcrumbItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Tools", href: "/dashboard/tools" },
  { label: "Contract Scanner" },
];

export default function ContractScannerPage() {
  const [scanResult, setScanResult] = useState<ContractScanResultType | null>(null);

  const handleScanComplete = (result: ContractScanResultType) => {
    setScanResult(result);
  };

  const handleReset = () => {
    setScanResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Legal Disclaimer */}
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Not Legal Advice</AlertTitle>
        <AlertDescription>
          This tool provides general guidance only and is not a substitute for
          professional legal advice. Always consult a qualified attorney before
          signing contracts.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold md:text-3xl">Contract Scanner</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload a contract or paste the text to analyze it for red flags, missing clauses, and areas to negotiate.
        </p>
      </header>

      {/* Form or Result */}
      {!scanResult ? (
        <ContractScannerForm onScanComplete={handleScanComplete} />
      ) : (
        <ContractScanResult result={scanResult} onReset={handleReset} />
      )}
    </div>
  );
}
