"use client";

import { useState, useEffect, startTransition } from "react";
import { ProfileForm } from "@/components/forms/profile-form";

export default function ProfilePage() {
  const [initialData, setInitialData] = useState<Record<string, unknown> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("creatorProfile");
    startTransition(() => {
      if (stored) {
        try {
          setInitialData(JSON.parse(stored));
        } catch {
          // Invalid JSON, start fresh
        }
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">Your Creator Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your metrics power accurate rate calculations. The more complete, the better.
        </p>
      </div>

      <ProfileForm initialData={initialData} />
    </div>
  );
}
