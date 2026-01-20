"use client";

import { useRouter } from "next/navigation";
import { SavedRates } from "@/components/rate-card/saved-rates";

export default function SavedRatesPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Rates</h1>
        <p className="text-muted-foreground mt-1">
          Quick reference for DM conversations.
        </p>
      </div>

      <SavedRates
        onQuickQuote={() => router.push("/dashboard/quick-quote")}
        onUploadBrief={() => router.push("/dashboard/upload")}
      />
    </div>
  );
}
