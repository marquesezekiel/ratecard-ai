"use client";

import { useRouter } from "next/navigation";
import { SavedRates } from "@/components/rate-card/saved-rates";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const breadcrumbItems = [
  { label: "Home", href: "/dashboard" },
  { label: "My Rates" },
];

export default function SavedRatesPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold">Your Rates</h1>
        <p className="text-muted-foreground">
          Quick reference for DM conversations.
        </p>
      </header>

      <SavedRates
        onQuickQuote={() => router.push("/quick-calculate")}
        onUploadBrief={() => router.push("/dashboard/analyze")}
      />
    </div>
  );
}
