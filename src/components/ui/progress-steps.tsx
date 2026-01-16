"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface Step {
  label: string;
  status: "pending" | "active" | "complete";
}

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          {step.status === "complete" && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {step.status === "active" && (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          )}
          {step.status === "pending" && (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
          <span className={`text-sm ${
            step.status === "active" ? "text-primary font-medium" :
            step.status === "complete" ? "text-green-600" :
            "text-gray-400"
          }`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
