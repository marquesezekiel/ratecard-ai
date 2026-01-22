"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { ContractScannerForm } from "@/components/forms/contract-scanner-form";
import { ContractScanResult } from "@/components/contract-scan-result";
import type { ContractScanResult as ContractScanResultType } from "@/lib/types";

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
