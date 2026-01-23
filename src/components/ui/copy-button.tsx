"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  label?: string
}

export function CopyButton({
  text,
  className,
  variant = "outline",
  size = "sm",
  label = "Copy"
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("gap-2 transition-all", className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>{label}</span>
        </>
      )}
    </Button>
  )
}

// Minimal icon-only version
export function CopyIconButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn("h-8 w-8", className)}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  )
}
