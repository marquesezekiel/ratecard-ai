"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  MessageSquare,
  Mail,
  ImageIcon,
  FileText,
  Upload,
  Loader2,
  X,
  CheckCircle2,
  Pencil,
  RotateCcw
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useProfile } from "@/hooks/use-profile"
import type { ParsedBrief, PricingResult, DealQualityResult, ApiResponse } from "@/lib/types"

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
}

type AnalyzerState = "idle" | "parsing" | "calculating" | "complete" | "error"

interface InlineResult {
  brief: ParsedBrief
  pricing: PricingResult
  dealQuality: DealQualityResult
}

export function InlineMessageAnalyzer() {
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [mode, setMode] = useState<"text" | "file">("text")
  const [analyzerState, setAnalyzerState] = useState<AnalyzerState>("idle")
  const [inlineResult, setInlineResult] = useState<InlineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { profile } = useProfile()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setMode("file")
      setMessage("")
      // Reset any previous results
      setInlineResult(null)
      setAnalyzerState("idle")
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    noClick: mode === "text" && !selectedFile,
  })

  const parseAndCalculateFromFile = async (file: File) => {
    if (!profile) {
      router.push("/dashboard/profile")
      return
    }

    setAnalyzerState("parsing")
    setError(null)

    try {
      // Step 1: Parse the brief from file
      const formData = new FormData()
      formData.append("file", file)

      const parseResponse = await fetch("/api/parse-brief", {
        method: "POST",
        body: formData,
      })

      const parseResult: ApiResponse<Omit<ParsedBrief, "id">> = await parseResponse.json()

      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || "Failed to parse brief")
      }

      await calculateRate(parseResult.data as ParsedBrief)
    } catch (err) {
      setAnalyzerState("error")
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const parseAndCalculateFromText = async (text: string) => {
    if (!profile) {
      router.push("/dashboard/profile")
      return
    }

    setAnalyzerState("parsing")
    setError(null)

    try {
      // Step 1: Parse the brief from text
      const parseResponse = await fetch("/api/parse-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const parseResult: ApiResponse<Omit<ParsedBrief, "id">> = await parseResponse.json()

      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || "Failed to parse message")
      }

      await calculateRate(parseResult.data as ParsedBrief)
    } catch (err) {
      setAnalyzerState("error")
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const calculateRate = async (brief: ParsedBrief) => {
    setAnalyzerState("calculating")

    const calcResponse = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, brief }),
    })

    const calcResult: ApiResponse<{ dealQuality: DealQualityResult; pricing: PricingResult }> = await calcResponse.json()

    if (!calcResult.success || !calcResult.data) {
      throw new Error(calcResult.error || "Failed to calculate rate")
    }

    // Store brief in localStorage for the full rate card page
    localStorage.setItem("currentBrief", JSON.stringify(brief))

    setInlineResult({
      brief,
      pricing: calcResult.data.pricing,
      dealQuality: calcResult.data.dealQuality,
    })
    setAnalyzerState("complete")
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)

    if (mode === "file" && selectedFile) {
      // Parse file and calculate inline
      await parseAndCalculateFromFile(selectedFile)
    } else if (message.trim()) {
      // Parse text and calculate inline
      await parseAndCalculateFromText(message.trim())
    }

    setIsAnalyzing(false)
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setMode("text")
    setInlineResult(null)
    setAnalyzerState("idle")
    setError(null)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setMode("text")
    setInlineResult(null)
    setAnalyzerState("idle")
    setError(null)
    setMessage("")
  }

  const handleEditDetails = () => {
    // Navigate to the review form with brief pre-loaded
    router.push("/dashboard/analyze?tab=briefs")
  }

  const handleGetFullRateCard = () => {
    // Brief is already in localStorage, go to generate page
    router.push("/dashboard/generate")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (message.trim()) handleAnalyze()
    }
  }

  const canSubmit = mode === "file" ? !!selectedFile : message.trim().length > 0
  const isProcessing = analyzerState === "parsing" || analyzerState === "calculating"

  // Format helpers
  const formatLabel = (format: string): string => {
    const labels: Record<string, string> = {
      static: "Post",
      carousel: "Carousel",
      story: "Story",
      reel: "Reel",
      video: "Video",
      live: "Live",
      ugc: "UGC",
    }
    return labels[format] || format
  }

  const platformLabel = (platform: string): string => {
    const labels: Record<string, string> = {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      twitter: "X",
    }
    return labels[platform] || platform
  }

  const qualityLevelColors: Record<string, string> = {
    excellent: "bg-green-100 text-green-800",
    good: "bg-blue-100 text-blue-800",
    fair: "bg-amber-100 text-amber-800",
    caution: "bg-red-100 text-red-800",
  }

  // Show inline result
  if (analyzerState === "complete" && inlineResult) {
    const { brief, pricing, dealQuality } = inlineResult
    const usageText = brief.usageRights.durationDays === 0
      ? "Organic only"
      : brief.usageRights.durationDays >= 365
        ? "Perpetual usage"
        : `${brief.usageRights.durationDays}-day usage`

    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5 space-y-4">
          {/* Success Header */}
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium text-sm">Rate calculated</span>
          </div>

          {/* Big Rate Display */}
          <div className="text-center py-2">
            <p className="text-4xl md:text-5xl font-bold font-mono text-foreground">
              ${pricing.totalPrice.toLocaleString()}
            </p>
          </div>

          {/* One-line Summary */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{brief.brand.name}</span>
            <span>•</span>
            <span>{platformLabel(brief.content.platform)} {formatLabel(brief.content.format)}</span>
            {brief.content.quantity > 1 && (
              <>
                <span>×</span>
                <span>{brief.content.quantity}</span>
              </>
            )}
            <span>•</span>
            <span>{usageText}</span>
          </div>

          {/* Deal Quality Badge */}
          <div className="flex justify-center">
            <Badge className={cn("text-xs", qualityLevelColors[dealQuality.qualityLevel])}>
              {dealQuality.qualityLevel.charAt(0).toUpperCase() + dealQuality.qualityLevel.slice(1)} Deal
              <span className="ml-1 opacity-70">({dealQuality.totalScore}/100)</span>
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleGetFullRateCard} className="flex-1">
              Get Full Rate Card
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleEditDetails} title="Edit details">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} title="Start over">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (analyzerState === "error") {
    return (
      <Card className="border-2 border-destructive/30">
        <CardContent className="p-5 space-y-4">
          <div className="text-center py-4">
            <p className="text-destructive font-medium">Failed to calculate rate</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button variant="outline" onClick={handleReset} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show processing state
  if (isProcessing) {
    return (
      <Card className="border-2 border-primary/30">
        <CardContent className="p-5">
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {analyzerState === "parsing"
                ? (mode === "file" ? "Reading your brief..." : "Reading your message...")
                : "Calculating your rate..."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default input state
  return (
    <Card
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-primary/20 hover:border-primary/40"
      )}
    >
      <CardContent className="p-4 space-y-4">
        <input {...getInputProps()} />

        {/* File Selected State */}
        {selectedFile ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleClearFile()
              }}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          /* Text Input State */
          <Textarea
            placeholder={isDragActive
              ? "Drop your brief here..."
              : "Paste that brand DM here... or drop a brief 📄"
            }
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setMode("text")
            }}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "min-h-[100px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground/60",
              isDragActive && "opacity-50"
            )}
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-muted-foreground" aria-hidden="true">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> DMs
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Emails
            </span>
            <span className="flex items-center gap-1">
              <Upload className="h-3 w-3" /> Briefs
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Screenshots
            </span>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleAnalyze()
            }}
            disabled={!canSubmit || isAnalyzing}
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Calculating...
              </>
            ) : (
              <>
                Get My Rate
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
