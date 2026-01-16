"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { BriefUploader } from "@/components/forms/brief-uploader";
import { BriefReviewForm } from "@/components/forms/brief-review-form";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { ParsedBrief } from "@/lib/types";

type FlowStep = "upload" | "review";

export default function UploadPage() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [step, setStep] = useState<FlowStep>("upload");
  const [parsedBrief, setParsedBrief] = useState<Omit<ParsedBrief, "id"> | null>(null);

  useEffect(() => {
    const profile = localStorage.getItem("creatorProfile");
    startTransition(() => {
      setHasProfile(!!profile);
    });
  }, []);

  const handleBriefParsed = (brief: ParsedBrief) => {
    setParsedBrief(brief);
    setStep("review");
  };

  const handleConfirmBrief = (brief: Omit<ParsedBrief, "id">) => {
    localStorage.setItem("currentBrief", JSON.stringify(brief));
    router.push("/dashboard/generate");
  };

  const handleReparse = () => {
    setParsedBrief(null);
    setStep("upload");
  };

  // Loading state while checking for profile
  if (hasProfile === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No profile - prompt to create one first
  if (!hasProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold">Complete Your Profile First</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          We need your platform metrics to calculate accurate rates.
        </p>
        <Button onClick={() => router.push("/dashboard/profile")} className="mt-6">
          Go to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {step === "upload" ? "Upload Brand Brief" : "Review Brief Details"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {step === "upload"
            ? "Upload the brand's campaign brief and we'll extract the key details."
            : "Make sure everything looks right before we calculate your rate."
          }
        </p>
      </div>

      {step === "upload" && (
        <BriefUploader onBriefParsed={handleBriefParsed} />
      )}

      {step === "review" && parsedBrief && (
        <BriefReviewForm
          initialBrief={parsedBrief}
          onConfirm={handleConfirmBrief}
          onReparse={handleReparse}
        />
      )}
    </div>
  );
}
