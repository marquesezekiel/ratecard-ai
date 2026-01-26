"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Upload, ChevronDown, Settings } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import type { ContractScanResult, Platform, DealType } from "@/lib/types";

interface ContractScannerFormProps {
  onScanComplete?: (result: ContractScanResult) => void;
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
  { value: "threads", label: "Threads" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "pinterest", label: "Pinterest" },
  { value: "twitch", label: "Twitch" },
];

const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: "sponsored", label: "Sponsored Content" },
  { value: "ugc", label: "UGC (User-Generated Content)" },
];

/**
 * Contract Scanner Form Component
 *
 * Allows creators to upload or paste contracts for analysis.
 * Supports PDF, DOCX file uploads and plain text input.
 */
export function ContractScannerForm({ onScanComplete }: ContractScannerFormProps) {
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [contractText, setContractText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deal context (optional)
  const [platform, setPlatform] = useState<Platform | "">("");
  const [dealType, setDealType] = useState<DealType | "">("");
  const [offeredRate, setOfferedRate] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const filename = selectedFile.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx") && !filename.endsWith(".txt")) {
      setError("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    const filename = droppedFile.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx") && !filename.endsWith(".txt")) {
      setError("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    setFile(droppedFile);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const buildDealContext = () => {
    const context: { platform?: Platform; dealType?: DealType; offeredRate?: number } = {};
    if (platform) context.platform = platform as Platform;
    if (dealType) context.dealType = dealType as DealType;
    if (offeredRate) {
      const rate = parseFloat(offeredRate.replace(/[^0-9.]/g, ""));
      if (!isNaN(rate)) context.offeredRate = rate;
    }
    return Object.keys(context).length > 0 ? context : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response: Response;
      const dealContext = buildDealContext();

      if (inputMode === "upload" && file) {
        // File upload mode
        const formData = new FormData();
        formData.append("file", file);
        if (dealContext) {
          formData.append("dealContext", JSON.stringify(dealContext));
        }

        response = await fetch("/api/scan-contract", {
          method: "POST",
          body: formData,
        });
      } else {
        // Text paste mode
        if (!contractText.trim() || contractText.trim().length < 100) {
          throw new Error("Please enter at least 100 characters of contract text");
        }

        response = await fetch("/api/scan-contract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractText: contractText.trim(),
            dealContext,
          }),
        });
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to scan contract");
      }

      onScanComplete?.(result.data);

      // Track contract scan
      trackEvent('contract_scanned', {
        healthScore: result.data.healthScore,
      });

      toast.success("Contract analyzed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (inputMode === "upload") return !file;
    return !contractText.trim() || contractText.trim().length < 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Scan Your Contract
        </CardTitle>
        <CardDescription>
          Upload a contract file or paste the text to check for red flags, missing clauses, and terms to negotiate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Mode Tabs */}
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "paste" | "upload")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste">Paste Text</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

            {/* Paste Mode */}
            <TabsContent value="paste" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="contract-text">Contract Text</Label>
                <Textarea
                  id="contract-text"
                  placeholder="Paste your contract text here..."
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  rows={12}
                  className="resize-none font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  {contractText.length} characters (minimum 100)
                </p>
              </div>
            </TabsContent>

            {/* Upload Mode */}
            <TabsContent value="upload" className="space-y-4 mt-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                {file ? (
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-foreground">
                      Drop your contract here or click to upload
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports PDF, DOCX, and TXT files
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Optional Deal Context */}
          <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 w-full justify-between p-3 h-auto"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  Add Deal Context (optional)
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${contextOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Adding context helps us provide more relevant analysis.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal-type">Deal Type</Label>
                  <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_TYPES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offered-rate">Offered Rate</Label>
                  <Input
                    id="offered-rate"
                    type="text"
                    placeholder="$500"
                    value={offeredRate}
                    onChange={(e) => setOfferedRate(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitDisabled()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing contract...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Scan Contract
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
