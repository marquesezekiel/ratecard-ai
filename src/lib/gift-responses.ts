/**
 * Gift Response Generator
 *
 * Generates professional response templates for gift offers based on
 * the evaluation results. Each response type is designed to:
 * 1. Be professional and friendly
 * 2. Set appropriate boundaries
 * 3. Position the creator for future paid work
 * 4. Be ready to copy and send
 */

import type {
  GiftEvaluation,
  GiftResponse,
  GiftResponseType,
  GiftResponseContext,
  GiftRecommendation,
} from "./types";

// =============================================================================
// RESPONSE TEMPLATES
// =============================================================================

/**
 * Generate the "Accept with Hook" response.
 * Used when the gift is worth accepting but we want to plant seeds for paid work.
 */
function generateAcceptWithHookResponse(context: GiftResponseContext): GiftResponse {
  const brandName = context.brandName || "there";
  const productName = context.productName || "your product";

  const message = `Hi ${brandName}! Thanks for reaching out - I'd love to try ${productName}!

I'm happy to share my honest experience with my audience. If the content performs well, I'd love to discuss a paid partnership for future campaigns!

Where should I send my shipping info?`;

  const followUpReminder =
    "Set a reminder for 2 weeks after posting to share performance metrics and pitch paid collaboration.";

  const conversionScript = `Hi ${brandName}! Wanted to share - the ${productName} content performed great!

Results:
- [X] views
- [Y] likes
- [Z] saves

My audience loved it! I'd love to discuss a paid partnership for future campaigns. Here's my rate card: [link]

Let me know if you'd like to collaborate again!`;

  return {
    responseType: "accept_with_hook",
    message,
    followUpReminder,
    conversionScript,
  };
}

/**
 * Generate the "Counter with Hybrid" response.
 * Used when we want the product but need some payment to make it worthwhile.
 */
function generateCounterHybridResponse(context: GiftResponseContext): GiftResponse {
  const brandName = context.brandName || "there";
  const productName = context.productName || "the product";
  const fullRate = context.creatorRate || 500;
  const hybridRate = context.hybridRate || Math.round(fullRate * 0.5);
  const contentType = context.contentType || "dedicated content";

  const message = `Hi ${brandName}! Thank you for thinking of me - ${productName} looks amazing!

For ${contentType}, my rate is typically $${fullRate}. I'd be happy to do a hybrid collaboration:

→ Product gifted + $${hybridRate} = ${contentType} with my authentic review

This lets me create the high-quality content your brand deserves. Would that work with your budget?`;

  const followUpReminder =
    "If they accept the hybrid deal, track in Gift Tracker and follow up after posting with performance metrics.";

  const conversionScript = `Hi ${brandName}! The collaboration was so much fun, and my audience responded really well to ${productName}!

For our next campaign, I'd love to do a fully paid partnership. Based on the results we got, I think we could create even more impactful content together.

My rates are:
- Single post: $${fullRate}
- Multiple posts: $${Math.round(fullRate * 1.8)}
- Full campaign: Let's chat!

Would you be interested in discussing a paid partnership?`;

  return {
    responseType: "counter_hybrid",
    message,
    followUpReminder,
    conversionScript,
  };
}

/**
 * Generate the "Ask Budget First" response.
 * Used when we need more information before committing.
 */
function generateAskBudgetFirstResponse(context: GiftResponseContext): GiftResponse {
  const brandName = context.brandName || "there";

  const message = `Hi ${brandName}! Thanks for reaching out!

Before I confirm, I have a few quick questions:
1. What's the retail value of the product?
2. What deliverables are you hoping for?
3. Is there a budget for this partnership, or is it product-only?

Looking forward to hearing more!`;

  const followUpReminder = null; // No follow-up needed until we know more

  const conversionScript = null; // Can't generate conversion script without more context

  return {
    responseType: "ask_budget_first",
    message,
    followUpReminder,
    conversionScript,
  };
}

/**
 * Generate the "Decline Politely" response.
 * Used when the deal isn't worth it but we want to keep the door open.
 */
function generateDeclinePolitelyResponse(_context: GiftResponseContext): GiftResponse {
  const message = `Thanks so much for thinking of me!

I'm currently focused on paid partnerships, but I appreciate you reaching out. If you have budget for a collaboration in the future, I'd love to chat!

Best of luck with your campaign!`;

  return {
    responseType: "decline_politely",
    message,
    followUpReminder: null,
    conversionScript: null,
  };
}

/**
 * Generate the "Run Away" response.
 * Used when there are red flags and we should not engage.
 */
function generateRunAwayResponse(_context: GiftResponseContext): GiftResponse {
  const message = `Thank you for reaching out, but I don't think this is the right fit for me at this time.

Best of luck with your campaign!`;

  return {
    responseType: "run_away",
    message,
    followUpReminder: null,
    conversionScript: null,
  };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Map GiftRecommendation to GiftResponseType.
 */
function mapRecommendationToResponseType(
  recommendation: GiftRecommendation
): GiftResponseType {
  const mapping: Record<GiftRecommendation, GiftResponseType> = {
    accept_with_hook: "accept_with_hook",
    counter_hybrid: "counter_hybrid",
    ask_budget_first: "ask_budget_first",
    decline_politely: "decline_politely",
    run_away: "run_away",
  };
  return mapping[recommendation];
}

/**
 * Generate a response for a gift offer based on the evaluation.
 *
 * Response types:
 * - accept_with_hook: Accept the gift but plant seeds for paid work
 * - counter_hybrid: Ask for product + reduced payment
 * - ask_budget_first: Get more information before committing
 * - decline_politely: Say no but keep the door open
 * - run_away: Red flags detected, disengage
 *
 * @param evaluation - The gift evaluation result
 * @param context - Additional context for personalization
 * @returns Generated response with message and follow-up info
 */
export function generateGiftResponse(
  evaluation: GiftEvaluation,
  context: GiftResponseContext
): GiftResponse {
  const responseType = mapRecommendationToResponseType(evaluation.recommendation);

  // Merge context with evaluation data for richer responses
  const enrichedContext: GiftResponseContext = {
    ...context,
    hybridRate: context.hybridRate || evaluation.minimumAcceptableAddOn,
  };

  switch (responseType) {
    case "accept_with_hook":
      return generateAcceptWithHookResponse(enrichedContext);

    case "counter_hybrid":
      return generateCounterHybridResponse(enrichedContext);

    case "ask_budget_first":
      return generateAskBudgetFirstResponse(enrichedContext);

    case "decline_politely":
      return generateDeclinePolitelyResponse(enrichedContext);

    case "run_away":
      return generateRunAwayResponse(enrichedContext);

    default:
      // Fallback to ask_budget_first if unknown
      return generateAskBudgetFirstResponse(enrichedContext);
  }
}

/**
 * Generate a specific type of response regardless of evaluation.
 * Useful for UI components that want to show all response options.
 *
 * @param responseType - The type of response to generate
 * @param context - Context for personalization
 * @returns Generated response
 */
export function generateResponseByType(
  responseType: GiftResponseType,
  context: GiftResponseContext
): GiftResponse {
  switch (responseType) {
    case "accept_with_hook":
      return generateAcceptWithHookResponse(context);

    case "counter_hybrid":
      return generateCounterHybridResponse(context);

    case "ask_budget_first":
      return generateAskBudgetFirstResponse(context);

    case "decline_politely":
      return generateDeclinePolitelyResponse(context);

    case "run_away":
      return generateRunAwayResponse(context);

    default:
      return generateAskBudgetFirstResponse(context);
  }
}

/**
 * Get a brief description of what each response type means.
 * Useful for UI tooltips and explanations.
 */
export function getResponseTypeDescription(
  responseType: GiftResponseType
): { title: string; description: string } {
  const descriptions: Record<GiftResponseType, { title: string; description: string }> = {
    accept_with_hook: {
      title: "Accept & Position for Paid",
      description:
        "Accept the gift and share genuinely, while planting seeds for a future paid partnership.",
    },
    counter_hybrid: {
      title: "Counter with Hybrid Offer",
      description:
        "Ask for product + reduced payment to make the deal worthwhile for both parties.",
    },
    ask_budget_first: {
      title: "Ask Clarifying Questions",
      description:
        "Get more information about their budget and expectations before committing.",
    },
    decline_politely: {
      title: "Politely Decline",
      description:
        "Pass on this opportunity but keep the door open for future paid work.",
    },
    run_away: {
      title: "Decline (Red Flags)",
      description:
        "Red flags detected. Politely disengage without leaving the door open.",
    },
  };

  return descriptions[responseType] || descriptions.ask_budget_first;
}

/**
 * Get the conversion playbook script based on stage.
 * Used by the Gift Tracker for systematic conversion attempts.
 *
 * @param stage - Which stage of the conversion process
 * @param context - Context for personalization
 * @returns Conversion script for the stage
 */
export function getConversionPlaybookScript(
  stage: "performance_share" | "follow_up_30_day" | "new_launch_pitch" | "returning_brand_offer",
  context: GiftResponseContext
): string {
  const brandName = context.brandName || "there";
  const productName = context.productName || "your product";

  switch (stage) {
    case "performance_share":
      return `Hi ${brandName}! Wanted to share - the ${productName} content performed great!

📊 Results:
• [X] views
• [Y] likes
• [Z] saves

My audience loved it! I'd love to discuss a paid partnership for future campaigns. Here's my rate card: [link]`;

    case "follow_up_30_day":
      return `Hi ${brandName}! I've been using ${productName} for a month now and still loving it!

I noticed you have some exciting things coming up. I'd love to be part of your next campaign - I offer a 15% returning brand discount.

Would you be interested in discussing a paid collaboration?`;

    case "new_launch_pitch":
      return `Hi ${brandName}! I saw you're launching [new product] - congrats!

Since my audience responded so well to ${productName}, I think they'd love the new launch too. I'd be happy to create some content around it.

For returning brands, I offer a 15% discount on my standard rates. Would you like to discuss?`;

    case "returning_brand_offer":
      return `Hi ${brandName}! It's been great working with you, and I'd love to continue our partnership!

For returning brands, I offer:
• 15% discount on standard rates
• Priority scheduling
• Bundle discounts for multi-post campaigns

Here's my updated rate card: [link]

Let me know if you'd like to plan something for the upcoming season!`;

    default:
      return `Hi ${brandName}! I enjoyed working with your brand and would love to discuss future opportunities. Let me know if you have any upcoming campaigns!`;
  }
}
