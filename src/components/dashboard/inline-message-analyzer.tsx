"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRight,
  MessageSquare,
  Mail,
  ImageIcon,
  FileText,
  Upload,
  Loader2,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
}

export function InlineMessageAnalyzer() {
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [mode, setMode] = useState<"text" | "file">("text")
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setMode("file")
      setMessage("") // Clear text when file is dropped
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    noClick: mode === "text" && !selectedFile, // Don't open picker when typing
  })

  const handleAnalyze = async () => {
    setIsAnalyzing(true)

    if (mode === "file" && selectedFile) {
      // Navigate to upload flow with file
      // Store file reference for the upload page
      const fileData = {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      }
      sessionStorage.setItem("pendingBriefFile", JSON.stringify(fileData))
      // Note: We can't store the actual file in sessionStorage,
      // so we navigate to upload page where they can re-select
      router.push("/dashboard/analyze?tab=briefs")
    } else if (message.trim()) {
      // Navigate to analyzer with message
      router.push(`/dashboard/analyze?message=${encodeURIComponent(message)}`)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setMode("text")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (message.trim()) handleAnalyze()
    }
  }

  const canSubmit = mode === "file" ? !!selectedFile : message.trim().length > 0

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
                  {(selectedFile.size / 1024).toFixed(1)} KB · Click Analyze to parse
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
            onClick={(e) => e.stopPropagation()} // Prevent dropzone click
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
                {mode === "file" ? "Opening..." : "Analyzing..."}
              </>
            ) : (
              <>
                {mode === "file" ? "Parse Brief" : "Analyze"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
