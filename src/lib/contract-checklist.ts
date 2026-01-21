/**
 * Contract Terms Checklist Module
 *
 * Helps creators protect themselves by providing a comprehensive checklist
 * of essential contract terms to look for before signing brand deals.
 *
 * Organized into categories:
 * - Payment: Ensure you get paid properly and on time
 * - Content & Rights: Protect your creative work
 * - Exclusivity: Understand restrictions on other deals
 * - Legal: Standard protections every creator needs
 *
 * Also identifies RED FLAGS - terms that should raise concerns.
 */

import type {
  ParsedBrief,
  ChecklistPriority,
  ChecklistCategory,
  ContractChecklistItem,
  ContractRedFlag,
  ContractChecklist,
} from "./types";

// Re-export types for convenience
export type {
  ChecklistPriority,
  ChecklistCategory,
  ContractChecklistItem,
  ContractRedFlag,
  ContractChecklist,
};

// =============================================================================
// CHECKLIST ITEMS
// =============================================================================

/**
 * All payment-related checklist items.
 */
const PAYMENT_ITEMS: Omit<ContractChecklistItem, "applicable" | "highlighted">[] = [
  {
    id: "payment-amount",
    category: "payment",
    term: "Payment amount clearly stated",
    explanation: "The exact payment amount should be written in the contract, not just discussed verbally.",
    recommendation: "Exact dollar amount in writing",
    priority: "critical",
  },
  {
    id: "payment-timeline",
    category: "payment",
    term: "Payment timeline specified",
    explanation: "Know when you'll get paid. Net-15 means 15 days after invoice, Net-30 means 30 days.",
    recommendation: "Net-30 or better (Net-15 ideal)",
    priority: "critical",
  },
  {
    id: "late-payment-penalty",
    category: "payment",
    term: "Late payment penalty clause",
    explanation: "If the brand pays late, there should be consequences. This incentivizes timely payment.",
    recommendation: "1.5% monthly interest or 10% penalty after 30 days",
    priority: "important",
  },
  {
    id: "deposit-upfront",
    category: "payment",
    term: "Deposit/upfront payment",
    explanation: "Getting paid partially upfront protects you if the brand ghosts or cancels.",
    recommendation: "50% upfront, 50% on delivery",
    priority: "important",
  },
  {
    id: "kill-fee",
    category: "payment",
    term: "Kill fee if brand cancels",
    explanation: "If the brand cancels after you've started work, you should still get compensated.",
    recommendation: "25-50% kill fee for cancellation after contract signing",
    priority: "important",
  },
];

/**
 * All content and rights checklist items.
 */
const CONTENT_RIGHTS_ITEMS: Omit<ContractChecklistItem, "applicable" | "highlighted">[] = [
  {
    id: "deliverables-defined",
    category: "content_rights",
    term: "Deliverables clearly defined",
    explanation: "Exactly what you're creating should be spelled out - number of posts, format, length, etc.",
    recommendation: "Specific number, type, and duration of each deliverable",
    priority: "critical",
  },
  {
    id: "revision-rounds",
    category: "content_rights",
    term: "Revision rounds limited",
    explanation: "Unlimited revisions can turn a simple project into endless unpaid work.",
    recommendation: "Maximum 2 rounds of revisions included",
    priority: "critical",
  },
  {
    id: "usage-duration",
    category: "content_rights",
    term: "Usage rights duration specified",
    explanation: "How long can the brand use your content? This should be clearly limited.",
    recommendation: "30-90 days standard; longer = higher rate",
    priority: "critical",
  },
  {
    id: "usage-channels",
    category: "content_rights",
    term: "Usage channels specified",
    explanation: "Where can the brand use your content? Organic social, paid ads, website, TV?",
    recommendation: "List specific channels (organic only, or organic + paid, etc.)",
    priority: "critical",
  },
  {
    id: "usage-territory",
    category: "content_rights",
    term: "Territory specified",
    explanation: "Geographic scope of usage - domestic only or worldwide?",
    recommendation: "Domestic (single country) standard; worldwide = premium",
    priority: "important",
  },
  {
    id: "raw-content-ownership",
    category: "content_rights",
    term: "Creator retains ownership of raw content",
    explanation: "You should own your original footage/photos. Brand gets license to use final content only.",
    recommendation: "Creator owns all raw/unused content",
    priority: "important",
  },
];

/**
 * All exclusivity checklist items.
 */
const EXCLUSIVITY_ITEMS: Omit<ContractChecklistItem, "applicable" | "highlighted">[] = [
  {
    id: "exclusivity-period",
    category: "exclusivity",
    term: "Exclusivity period defined",
    explanation: "If you can't work with competitors, know exactly how long that restriction lasts.",
    recommendation: "Match campaign duration or maximum 30 days post",
    priority: "critical",
  },
  {
    id: "exclusivity-scope",
    category: "exclusivity",
    term: "Exclusivity scope defined",
    explanation: "Is it category exclusivity (no other beauty brands) or full exclusivity (no other brands at all)?",
    recommendation: "Category exclusivity only; full exclusivity = major premium",
    priority: "critical",
  },
  {
    id: "exclusivity-compensation",
    category: "exclusivity",
    term: "Exclusivity compensated appropriately",
    explanation: "Exclusivity costs you potential income. You should be paid extra for it.",
    recommendation: "+50% for category exclusivity, +100% for full exclusivity",
    priority: "critical",
  },
];

/**
 * All legal checklist items.
 */
const LEGAL_ITEMS: Omit<ContractChecklistItem, "applicable" | "highlighted">[] = [
  {
    id: "termination-clause",
    category: "legal",
    term: "Termination clause exists",
    explanation: "Both parties should be able to exit the contract under certain conditions.",
    recommendation: "30-day notice for either party to terminate",
    priority: "important",
  },
  {
    id: "dispute-resolution",
    category: "legal",
    term: "Dispute resolution specified",
    explanation: "If there's a disagreement, how will it be resolved? Avoid expensive litigation.",
    recommendation: "Mediation first, then arbitration; jurisdiction in your state",
    priority: "important",
  },
  {
    id: "liability-limits",
    category: "legal",
    term: "No unreasonable liability on creator",
    explanation: "You shouldn't be liable for things outside your control (brand's product issues, etc.).",
    recommendation: "Liability limited to contract value; no indemnification for brand's products",
    priority: "important",
  },
  {
    id: "ftc-compliance",
    category: "legal",
    term: "FTC compliance language included",
    explanation: "Contract should require both parties to comply with FTC disclosure rules.",
    recommendation: "Mutual FTC compliance; brand cannot ask you to hide sponsorship",
    priority: "important",
  },
];

// =============================================================================
// RED FLAGS
// =============================================================================

/**
 * All contract red flags.
 */
const RED_FLAGS: Omit<ContractRedFlag, "detected">[] = [
  {
    id: "perpetual-rights",
    flag: "Perpetual/unlimited usage rights without major premium",
    reason: "Giving away unlimited usage means the brand can use your content forever without additional payment. This is worth significant money.",
    action: "Either remove perpetual rights or charge 3-5x the base rate",
    severity: "high",
  },
  {
    id: "unpaid-usage-rights",
    flag: "No payment for usage rights",
    reason: "Usage rights (whitelisting, ads, etc.) have real value. You should be compensated for them.",
    action: "Add usage rights fee: +50% for organic repost, +100% for paid ads, +200% for full media buy",
    severity: "high",
  },
  {
    id: "uncompensated-exclusivity",
    flag: "Exclusivity without compensation",
    reason: "Exclusivity prevents you from earning money with competitors. That opportunity cost should be paid.",
    action: "Add exclusivity premium: +50% for category, +100% for full exclusivity",
    severity: "high",
  },
  {
    id: "long-payment-terms",
    flag: "Payment terms beyond Net-60",
    reason: "Net-90 or longer means waiting 3+ months for payment. That's too long and often a sign of cash flow problems.",
    action: "Negotiate to Net-30 maximum, or require 50% upfront",
    severity: "high",
  },
  {
    id: "unlimited-revisions",
    flag: "Unlimited revisions",
    reason: "This can trap you in endless revision cycles. Some brands abuse this to get extra content for free.",
    action: "Cap at 2 revision rounds; additional revisions at hourly rate",
    severity: "medium",
  },
  {
    id: "moral-rights-waiver",
    flag: "Moral rights waiver",
    reason: "Moral rights protect your reputation. Waiving them means the brand can modify your content in ways you might not approve.",
    action: "Remove moral rights waiver or limit modifications to minor edits with your approval",
    severity: "medium",
  },
  {
    id: "broad-non-disparagement",
    flag: "Non-disparagement clause that's too broad",
    reason: "Overly broad non-disparagement can prevent you from honestly discussing your experience, even if the brand treats you poorly.",
    action: "Limit to during the campaign period, or make it mutual",
    severity: "medium",
  },
  {
    id: "no-kill-fee",
    flag: "No kill fee for brand cancellation",
    reason: "If you've blocked your schedule and turned down other work, you deserve compensation if the brand cancels.",
    action: "Add 25-50% kill fee clause for cancellation after signing",
    severity: "medium",
  },
  {
    id: "work-for-hire",
    flag: "Work for hire language (you lose all ownership)",
    reason: "Work for hire means the brand owns everything you create, including raw footage. You can't reuse any of it.",
    action: "Change to license agreement where you retain ownership but grant usage rights",
    severity: "medium",
  },
  {
    id: "auto-renewal",
    flag: "Auto-renewal without easy opt-out",
    reason: "Contracts that automatically renew can trap you in deals you no longer want.",
    action: "Require written consent for renewal, not automatic",
    severity: "low",
  },
];

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Generate a contract checklist based on the brief data.
 *
 * @param brief - The parsed brief data (optional - used to highlight applicable items)
 * @returns Complete contract checklist with applicable items highlighted
 */
export function getContractChecklist(brief?: ParsedBrief): ContractChecklist {
  // Combine all items
  const allBaseItems = [
    ...PAYMENT_ITEMS,
    ...CONTENT_RIGHTS_ITEMS,
    ...EXCLUSIVITY_ITEMS,
    ...LEGAL_ITEMS,
  ];

  // Process items with applicability based on brief
  const items: ContractChecklistItem[] = allBaseItems.map((item) => ({
    ...item,
    applicable: isItemApplicable(item, brief),
    highlighted: isItemHighlighted(item, brief),
  }));

  // Process red flags with detection based on brief
  const redFlags: ContractRedFlag[] = RED_FLAGS.map((flag) => ({
    ...flag,
    detected: isRedFlagDetected(flag, brief),
  }));

  // Calculate summary
  const criticalItems = items.filter((i) => i.priority === "critical").length;
  const highlightedItems = items.filter((i) => i.highlighted).length;
  const detectedRedFlags = redFlags.filter((f) => f.detected).length;

  // Category counts
  const byCategory = {
    payment: items.filter((i) => i.category === "payment").length,
    content_rights: items.filter((i) => i.category === "content_rights").length,
    exclusivity: items.filter((i) => i.category === "exclusivity").length,
    legal: items.filter((i) => i.category === "legal").length,
  };

  // Generate deal-specific notes
  const dealNotes = generateDealNotes(brief);

  return {
    items,
    redFlags,
    summary: {
      totalItems: items.length,
      criticalItems,
      highlightedItems,
      detectedRedFlags,
    },
    byCategory,
    dealNotes,
  };
}

/**
 * Get checklist items filtered by category.
 */
export function getItemsByCategory(
  checklist: ContractChecklist,
  category: ChecklistCategory
): ContractChecklistItem[] {
  return checklist.items.filter((item) => item.category === category);
}

/**
 * Get only critical items from the checklist.
 */
export function getCriticalItems(checklist: ContractChecklist): ContractChecklistItem[] {
  return checklist.items.filter((item) => item.priority === "critical");
}

/**
 * Get only highlighted items (applicable to this specific deal).
 */
export function getHighlightedItems(checklist: ContractChecklist): ContractChecklistItem[] {
  return checklist.items.filter((item) => item.highlighted);
}

/**
 * Get detected red flags.
 */
export function getDetectedRedFlags(checklist: ContractChecklist): ContractRedFlag[] {
  return checklist.redFlags.filter((flag) => flag.detected);
}

/**
 * Get red flags by severity.
 */
export function getRedFlagsBySeverity(
  checklist: ContractChecklist,
  severity: ContractRedFlag["severity"]
): ContractRedFlag[] {
  return checklist.redFlags.filter((flag) => flag.severity === severity);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine if a checklist item is applicable based on the brief.
 */
function isItemApplicable(
  item: Omit<ContractChecklistItem, "applicable" | "highlighted">,
  brief?: ParsedBrief
): boolean {
  // All items are generally applicable by default
  // Some items become more relevant based on deal type
  if (!brief) return true;

  // Exclusivity items only applicable if exclusivity is mentioned
  if (item.category === "exclusivity") {
    const hasExclusivity = brief.usageRights?.exclusivity &&
      brief.usageRights.exclusivity !== "none";
    return hasExclusivity ?? true; // Default to true if not specified
  }

  return true;
}

/**
 * Determine if a checklist item should be highlighted for this deal.
 */
function isItemHighlighted(
  item: Omit<ContractChecklistItem, "applicable" | "highlighted">,
  brief?: ParsedBrief
): boolean {
  if (!brief) return false;

  switch (item.id) {
    // Highlight usage rights items if usage rights are specified
    case "usage-duration":
    case "usage-channels":
    case "usage-territory":
      return brief.usageRights?.durationDays !== undefined ||
        brief.usageRights?.paidAmplification === true;

    // Highlight exclusivity items if exclusivity is mentioned
    case "exclusivity-period":
    case "exclusivity-scope":
    case "exclusivity-compensation":
      return brief.usageRights?.exclusivity !== undefined &&
        brief.usageRights.exclusivity !== "none";

    // Highlight revision rounds for all deals
    case "revision-rounds":
      return true;

    // Highlight payment items for all deals
    case "payment-amount":
    case "payment-timeline":
      return true;

    // Highlight deposit for larger deals (retainer, ambassador)
    case "deposit-upfront":
      return brief.retainerConfig !== undefined ||
        brief.pricingModel === "hybrid" ||
        brief.pricingModel === "performance";

    // Highlight kill fee for long-term deals
    case "kill-fee":
      return brief.retainerConfig !== undefined;

    default:
      return false;
  }
}

/**
 * Determine if a red flag is detected based on brief data.
 */
function isRedFlagDetected(
  flag: Omit<ContractRedFlag, "detected">,
  brief?: ParsedBrief
): boolean {
  if (!brief) return false;

  switch (flag.id) {
    // Detect perpetual rights if duration is very long
    case "perpetual-rights":
      return brief.usageRights?.durationDays !== undefined &&
        brief.usageRights.durationDays > 365;

    // Detect unpaid usage rights if whitelisting requested without premium
    case "unpaid-usage-rights":
      return brief.usageRights?.paidAmplification === true;

    // Detect uncompensated exclusivity
    case "uncompensated-exclusivity":
      return brief.usageRights?.exclusivity !== undefined &&
        brief.usageRights.exclusivity !== "none";

    default:
      return false;
  }
}

/**
 * Generate deal-specific notes based on brief data.
 */
function generateDealNotes(brief?: ParsedBrief): string[] {
  const notes: string[] = [];

  if (!brief) {
    notes.push("Review all items - no specific deal data provided.");
    return notes;
  }

  // Deal type notes
  if (brief.dealType === "ugc") {
    notes.push("UGC Deal: Ensure deliverables and revision rounds are clearly defined since you're being paid per asset, not per audience.");
  }

  // Pricing model notes
  if (brief.pricingModel === "affiliate") {
    notes.push("Affiliate Deal: Ensure commission rate, tracking method, and payment frequency are clearly stated.");
  } else if (brief.pricingModel === "hybrid") {
    notes.push("Hybrid Deal: Ensure both base fee AND commission terms are clearly documented separately.");
  } else if (brief.pricingModel === "performance") {
    notes.push("Performance Deal: Ensure bonus thresholds and metrics are specific and measurable.");
  }

  // Retainer notes
  if (brief.retainerConfig) {
    const length = brief.retainerConfig.dealLength;
    if (length === "12_month") {
      notes.push("Ambassador Deal: This is a long-term commitment. Ensure exit clauses and performance review periods exist.");
    } else if (length === "6_month" || length === "3_month") {
      notes.push("Retainer Deal: Monthly deliverables should be clearly defined with flexibility for unused content.");
    }
  }

  // Usage rights notes
  if (brief.usageRights) {
    if (brief.usageRights.paidAmplification) {
      notes.push("Paid Amplification: Brand wants to run your content as ads. Ensure this is compensated appropriately (+100% minimum).");
    }
    if (brief.usageRights.exclusivity === "full") {
      notes.push("Full Exclusivity: You cannot work with ANY other brands during this period. This should come with major premium (+100%).");
    } else if (brief.usageRights.exclusivity === "category") {
      notes.push("Category Exclusivity: You cannot work with competitors. Ensure the category is narrowly defined.");
    }
    if (brief.usageRights.durationDays && brief.usageRights.durationDays > 90) {
      notes.push(`Extended Usage: ${brief.usageRights.durationDays} days is longer than standard. Ensure rate reflects this.`);
    }
  }

  if (notes.length === 0) {
    notes.push("Standard deal structure detected. Review all critical items before signing.");
  }

  return notes;
}

/**
 * Get all checklist items (without brief context).
 */
export function getAllChecklistItems(): ContractChecklistItem[] {
  const allBaseItems = [
    ...PAYMENT_ITEMS,
    ...CONTENT_RIGHTS_ITEMS,
    ...EXCLUSIVITY_ITEMS,
    ...LEGAL_ITEMS,
  ];

  return allBaseItems.map((item) => ({
    ...item,
    applicable: true,
    highlighted: false,
  }));
}

/**
 * Get all red flags (without brief context).
 */
export function getAllRedFlags(): ContractRedFlag[] {
  return RED_FLAGS.map((flag) => ({
    ...flag,
    detected: false,
  }));
}
