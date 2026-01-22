"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIconButton } from "@/components/ui/copy-button";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import type { PricingResult } from "@/lib/types";

interface NegotiationCheatSheetProps {
  pricing: PricingResult;
}

interface Script {
  objection: string;
  response: string;
}

function generateScripts(pricing: PricingResult): Script[] {
  const rate = pricing.totalPrice;
  const perDeliverable = pricing.pricePerDeliverable;
  const quantity = pricing.quantity;

  // Find key value drivers from layers
  const usageLayer = pricing.layers.find(l => l.name === "Usage Rights");
  const engagementLayer = pricing.layers.find(l => l.name === "Engagement Multiplier");
  const hasUsageRights = usageLayer && usageLayer.adjustment > 0;
  const hasStrongEngagement = engagementLayer && engagementLayer.adjustment > 0;

  return [
    {
      objection: `"That's above our budget. Can you do it for $${Math.round(rate * 0.4)}?"`,
      response: `I appreciate you sharing your budget! For $${Math.round(rate * 0.4)}, I could offer [organic posting only / 1 deliverable instead of ${quantity} / story-only coverage]. My full rate of $${rate} reflects ${hasUsageRights ? "the usage rights included" : "the production quality and reach"}. Would a smaller package work for this campaign?`,
    },
    {
      objection: `"Other creators are charging less for the same thing."`,
      response: `I price based on my specific metrics — ${hasStrongEngagement ? "my engagement rate is above platform average, which means your content will actually be seen and acted on" : "my audience demographics and content quality"}. I'm happy to walk you through the breakdown so you can see exactly what you're paying for. Sometimes lower rates mean lower reach or engagement.`,
    },
    {
      objection: `"Can you do it for exposure/product only?"`,
      response: `I'd love to work together! I offer paid collaborations starting at $${perDeliverable}. I do accept gifted partnerships selectively — typically for brands I already use and love. Would you like to discuss a paid package, or tell me more about the product?`,
    },
    {
      objection: `"We need exclusivity but can't pay more."`,
      response: `Exclusivity means I'd turn down other brands in your category during that period, which is a real cost for me. My rate of $${rate} ${hasUsageRights ? "already includes usage rights" : "is for organic posting only"}. For exclusivity, I'd need to add $${Math.round(rate * 0.25)}-${Math.round(rate * 0.5)} depending on the duration. What exclusivity period did you have in mind?`,
    },
    {
      objection: `"We'll have more campaigns later — can you give us a discount now?"`,
      response: `I'd be excited about an ongoing partnership! I offer package rates for multi-campaign commitments — typically 10-15% off when we agree to 3+ collaborations upfront. For this first campaign at $${rate}, I'd love to prove the ROI and then discuss a longer-term rate.`,
    },
  ];
}

export function NegotiationCheatSheet({ pricing }: NegotiationCheatSheetProps) {
  const [expanded, setExpanded] = useState(true);

  const scripts = generateScripts(pricing);

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <MessageSquare className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <CardTitle className="text-xl">Negotiation Cheat Sheet</CardTitle>
              <p className="text-sm text-muted-foreground">
                What to say when they push back
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {scripts.map((script, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/50 overflow-hidden"
            >
              {/* Objection */}
              <div className="bg-muted/50 px-4 py-3">
                <p className="text-sm font-medium text-muted-foreground">
                  They say:
                </p>
                <p className="font-medium mt-1">{script.objection}</p>
              </div>

              {/* Response */}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">
                      You say:
                    </p>
                    <p className="text-sm leading-relaxed">{script.response}</p>
                  </div>
                  <CopyIconButton text={script.response} className="flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Tip: Always be friendly and flexible on scope, firm on your base rate.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
