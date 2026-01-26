"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Upload, User, X, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: typeof MessageSquare;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="message-input"]',
    title: "Analyze Brand Messages",
    description:
      "Paste any DM or email from a brand. We'll tell you if it's legit, detect gift offers, and suggest what to charge.",
    icon: MessageSquare,
    position: "bottom",
  },
  {
    target: '[data-tour="brief-upload"]',
    title: "Upload Brand Briefs",
    description:
      "Got a PDF or DOCX brief from a brand? Drop it here and we'll extract all the details and calculate your rate.",
    icon: Upload,
    position: "bottom",
  },
  {
    target: '[data-tour="profile-link"]',
    title: "Complete Your Profile",
    description:
      "The more we know about you, the more accurate your rates. Add engagement rate, niche, and audience data.",
    icon: User,
    position: "left",
  },
];

interface DashboardTourProps {
  /** Whether to show the tour */
  show: boolean;
  /** Callback when tour is completed or skipped */
  onComplete: () => void;
}

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PopoverPosition {
  top: number;
  left: number;
}

export function DashboardTour({ show, onComplete }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightPos, setHighlightPos] = useState<HighlightPosition | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate element position for highlight
  const updatePositions = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;

      setHighlightPos({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate popover position based on step.position
      const popoverWidth = 320;
      const popoverHeight = 200;
      const gap = 16;

      let top = 0;
      let left = 0;

      switch (step.position) {
        case "bottom":
          top = rect.bottom + gap + window.scrollY;
          left = rect.left + rect.width / 2 - popoverWidth / 2;
          break;
        case "top":
          top = rect.top - popoverHeight - gap + window.scrollY;
          left = rect.left + rect.width / 2 - popoverWidth / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - popoverHeight / 2 + window.scrollY;
          left = rect.left - popoverWidth - gap;
          break;
        case "right":
          top = rect.top + rect.height / 2 - popoverHeight / 2 + window.scrollY;
          left = rect.right + gap;
          break;
      }

      // Keep within viewport
      left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));
      top = Math.max(16 + window.scrollY, top);

      setPopoverPos({ top, left });
    } else {
      // Element not found, use centered fallback
      setHighlightPos(null);
      setPopoverPos({
        top: window.innerHeight / 2 - 100 + window.scrollY,
        left: window.innerWidth / 2 - 160,
      });
    }
  }, [currentStep]);

  // Delayed show to allow page to render
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        updatePositions();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      queueMicrotask(() => setIsVisible(false));
    }
  }, [show, updatePositions]);

  // Update positions on step change or resize
  useEffect(() => {
    if (!isVisible) return;

    // Use microtask to defer position update
    queueMicrotask(() => updatePositions());

    const handleResize = () => updatePositions();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [isVisible, currentStep, updatePositions]);

  // Save tour completion to API
  const saveTourCompletion = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasSeenDashboardTour: true }),
      });
    } catch (error) {
      console.error("Failed to save tour completion:", error);
    }
    setIsSaving(false);
  }, []);

  // Define handleComplete first since it's used by other handlers
  const handleComplete = useCallback(async () => {
    await saveTourCompletion();
    setIsVisible(false);
    onComplete();
  }, [onComplete, saveTourCompletion]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleNext, handlePrev, handleSkip]);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return createPortal(
    <>
      {/* Semi-transparent overlay with cutout */}
      <div
        className="fixed inset-0 z-[100] transition-opacity duration-300"
        style={{
          background: highlightPos
            ? `radial-gradient(ellipse ${highlightPos.width + 40}px ${highlightPos.height + 40}px at ${highlightPos.left + highlightPos.width / 2}px ${highlightPos.top + highlightPos.height / 2 - window.scrollY}px, transparent 0%, rgba(0, 0, 0, 0.75) 100%)`
            : "rgba(0, 0, 0, 0.75)",
        }}
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Highlight border around target element */}
      {highlightPos && (
        <div
          className="fixed z-[101] pointer-events-none rounded-xl ring-4 ring-primary ring-offset-2 ring-offset-background transition-all duration-300"
          style={{
            top: highlightPos.top - window.scrollY,
            left: highlightPos.left,
            width: highlightPos.width,
            height: highlightPos.height,
          }}
        />
      )}

      {/* Popover Card */}
      {popoverPos && (
        <div
          ref={popoverRef}
          className="fixed z-[102] w-80 animate-in zoom-in-95 fade-in duration-300"
          style={{
            top: popoverPos.top - window.scrollY,
            left: popoverPos.left,
          }}
        >
          <Card className="shadow-2xl border-2 border-primary/30">
            <CardHeader className="relative pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground"
                onClick={handleSkip}
                disabled={isSaving}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-xs">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {TOUR_STEPS.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-200",
                      index === currentStep
                        ? "bg-primary w-4"
                        : index < currentStep
                        ? "bg-primary/50"
                        : "bg-muted"
                    )}
                    onClick={() => setCurrentStep(index)}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0 || isSaving}
                  className={cn(currentStep === 0 && "invisible")}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    disabled={isSaving}
                  >
                    Skip
                  </Button>
                  <Button size="sm" onClick={handleNext} disabled={isSaving}>
                    {isSaving ? (
                      "Saving..."
                    ) : isLastStep ? (
                      "Get Started"
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>,
    document.body
  );
}
