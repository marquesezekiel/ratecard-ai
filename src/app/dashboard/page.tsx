"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { User, Upload, FileText, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StepStatus {
  hasProfile: boolean;
  hasBrief: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StepStatus | null>(null);

  useEffect(() => {
    startTransition(() => {
      setStatus({
        hasProfile: !!localStorage.getItem("creatorProfile"),
        hasBrief: !!localStorage.getItem("currentBrief"),
      });
    });
  }, []);

  const steps = [
    {
      title: "Set Up Profile",
      description: "Add your platform metrics and audience data",
      icon: User,
      href: "/dashboard/profile",
      isComplete: status?.hasProfile ?? false,
      step: 1,
    },
    {
      title: "Upload Brief",
      description: "Upload the brand's campaign brief",
      icon: Upload,
      href: "/dashboard/upload",
      isComplete: status?.hasBrief ?? false,
      step: 2,
    },
    {
      title: "Generate Rate Card",
      description: "Get your personalized rate and download PDF",
      icon: FileText,
      href: "/dashboard/generate",
      isComplete: false,
      step: 3,
    },
  ];

  // Get the next step to complete
  const nextStep = steps.find((s) => !s.isComplete) || steps[2];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">
          {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome to RateCard.AI"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate professional rate cards in 3 simple steps
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Need a quick rate?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Brand just DM&apos;d you? Get an instant quote in 30 seconds.
            </p>
            <Button asChild>
              <Link href="/dashboard/quick-quote">
                Quick Quote <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Have a brand brief?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload the full brief for more accurate, tailored pricing.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/upload">
                Upload Brief <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Step Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <Card
            key={step.step}
            className={cn(
              "relative transition-shadow hover:shadow-md",
              step.isComplete && "border-green-200 bg-green-50/50"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    step.isComplete
                      ? "bg-green-100 text-green-600"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {step.isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {step.isComplete && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Complete
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant={step.isComplete ? "outline" : "default"}
                className="w-full"
              >
                <Link href={step.href}>
                  {step.isComplete ? "Edit" : "Start"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <Card className="mt-8 bg-primary text-primary-foreground">
        <CardContent className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <div>
            <h3 className="font-semibold">Ready to get your rate?</h3>
            <p className="text-sm text-primary-foreground/80">
              {!status?.hasProfile
                ? "Start by setting up your creator profile"
                : !status?.hasBrief
                  ? "Upload a brand brief to calculate your rate"
                  : "You're all set! Generate your rate card now"}
            </p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link href={nextStep.href}>
              {nextStep.title}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
