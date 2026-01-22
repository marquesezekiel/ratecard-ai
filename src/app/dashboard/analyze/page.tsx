"use client";

import { useState, useSyncExternalStore, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DMParserForm } from "@/components/forms/dm-parser-form";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";
import type { CreatorProfile, DMAnalysis } from "@/lib/types";

const emptySubscribe = () => () => {};

function useLocalStorageProfile(): CreatorProfile | null | undefined {
  const cacheRef = useRef<{ raw: string | null; parsed: CreatorProfile | null }>({ raw: null, parsed: null });

  const getSnapshot = useCallback(() => {
    const raw = localStorage.getItem("creatorProfile");
    if (raw !== cacheRef.current.raw) {
      cacheRef.current.raw = raw;
      cacheRef.current.parsed = raw ? JSON.parse(raw) as CreatorProfile : null;
    }
    return cacheRef.current.parsed;
  }, []);

  const getServerSnapshot = useCallback((): CreatorProfile | null | undefined => undefined, []);

  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

export default function AnalyzeDMPage() {
  const router = useRouter();
  const profile = useLocalStorageProfile();
  const [lastAnalysis, setLastAnalysis] = useState<DMAnalysis | null>(null);

  // Loading state
  if (profile === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Complete Your Profile First</h2>
        <p className="text-center text-muted-foreground max-w-md">
          We need your follower counts and engagement rates to analyze DMs and suggest rates.
        </p>
        <Button onClick={() => router.push("/dashboard/profile")}>
          Set Up Profile
        </Button>
      </div>
    );
  }

  const handleAnalysisComplete = (analysis: DMAnalysis) => {
    setLastAnalysis(analysis);
  };

  const handleEvaluateGift = (analysis: DMAnalysis) => {
    // Store the analysis for the gift evaluator page
    sessionStorage.setItem("giftAnalysis", JSON.stringify(analysis));
    router.push("/dashboard/gifts?evaluate=true");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold md:text-3xl">Analyze Brand DM</h1>
        </div>
        <p className="text-muted-foreground">
          Paste a brand message to get instant analysis, detect gift offers, and generate a professional response.
        </p>
      </div>

      {/* DM Parser Form */}
      <DMParserForm
        profile={profile}
        onAnalysisComplete={handleAnalysisComplete}
        onEvaluateGift={handleEvaluateGift}
      />
    </div>
  );
}
