"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, FileText, ArrowRight, Clock, MessageSquare, Gift } from "lucide-react";

interface RateCardHistoryItem {
  name: string;
  platform: string;
  format: string;
  price: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentRates, setRecentRates] = useState<RateCardHistoryItem[]>([]);

  useEffect(() => {
    startTransition(() => {
      const savedRates = localStorage.getItem("savedRates");
      if (savedRates) setRecentRates(JSON.parse(savedRates).slice(0, 5));
    });
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const hasRates = recentRates.length > 0;

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Get a defendable rate in minutes.
        </p>
      </div>

      {/* Main Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Quick Quote</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Get a rate in 30 seconds — perfect for DM inquiries.
            </p>
            <Link href="/dashboard/quick-quote">
              <Button className="w-full sm:w-auto">
                Get My Rate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Analyze Brand DM</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Paste a brand message to get instant analysis and response.
            </p>
            <Link href="/dashboard/analyze">
              <Button variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50">
                Analyze DM
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-4">
              <FileText className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Upload Brief</h2>
            <p className="text-muted-foreground text-sm mb-6">
              For precise pricing from a brand&apos;s campaign brief.
            </p>
            <Link href="/dashboard/upload">
              <Button variant="outline" className="w-full sm:w-auto">
                Upload Brief
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 mb-4">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Evaluate Gift Offer</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Decide if a gift deal is worth your time and what to ask for.
            </p>
            <Link href="/dashboard/gifts">
              <Button variant="outline" className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50">
                Evaluate Gift
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Rates</h2>
          {hasRates && (
            <Link href="/dashboard/rates">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {hasRates ? (
          <div className="grid gap-3">
            {recentRates.map((rate, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{rate.name || "Quick Quote"}</p>
                    <p className="text-sm text-muted-foreground">
                      {rate.platform} · {rate.format}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${rate.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(rate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">
              Your rate cards will appear here after you generate them.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
