"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  title: string;
  description: string;
  badge?: "Recommended" | "Optional";
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function ProfileSection({
  title,
  description,
  badge,
  defaultOpen = true,
  children,
}: ProfileSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {badge && (
                <Badge
                  variant={badge === "Recommended" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {badge}
                </Badge>
              )}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      <div
        className={cn(
          "grid transition-all duration-200",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0">{children}</CardContent>
        </div>
      </div>
    </Card>
  );
}
