"use client";

import Link from "next/link";
import { Clock, FileText, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>

          <h1 className="mt-6 text-2xl font-bold">Coming Soon</h1>
          <p className="mt-2 text-muted-foreground max-w-sm">
            Your rate card history will appear here once this feature launches.
          </p>

          <div className="mt-8 space-y-3 text-left text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4" />
              <span>Save and revisit past rate cards</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4" />
              <span>Track how your rates evolve over time</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4" />
              <span>Quickly regenerate cards for returning brands</span>
            </div>
          </div>

          <Button asChild className="mt-8">
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
