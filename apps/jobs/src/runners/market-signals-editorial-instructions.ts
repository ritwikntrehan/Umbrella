export interface MarketSignalsEditorialInstructions {
  instruction_version: string;
  channel_id: "market-signals";
  tone: string;
  compression_style: {
    summary: string;
    bullets: string;
    cta: string;
  };
  emphasize: string[];
  avoid: string[];
  no_change_run_guidance: {
    summary_focus: string;
    what_changed_style: string;
    watchlist_style: string;
  };
  changed_run_guidance: {
    summary_focus: string;
    what_changed_style: string;
    watchlist_style: string;
  };
  cta_style_guidance: string[];
  provenance_handling_rules: string[];
  llm_integration: {
    enabled_by_default: false;
    mode: "deterministic-template" | "llm";
    notes: string;
  };
}

export const MARKET_SIGNALS_EDITORIAL_INSTRUCTIONS_V1: MarketSignalsEditorialInstructions = {
  instruction_version: "market-signals-editorial-v1",
  channel_id: "market-signals",
  tone: "Crisp, operational, and market-monitoring oriented.",
  compression_style: {
    summary: "Two sentences max. Lead with deterministic change status.",
    bullets: "Prefer short bullets with IDs/titles; avoid speculative claims.",
    cta: "One sentence, action-oriented, scoped to market-signals monitoring support."
  },
  emphasize: [
    "Deterministic status (initial/no_change/changed)",
    "Near-term pricing, freight, or inventory monitoring shifts",
    "Watchlist candidates requiring quick operational review"
  ],
  avoid: [
    "Unverifiable forecasting claims",
    "Investment advice or predictive calls beyond deterministic facts",
    "Cross-channel synthesis or umbrella highlights"
  ],
  no_change_run_guidance: {
    summary_focus: "Reinforce monitoring stability and reduced immediate escalation pressure.",
    what_changed_style: "State that no net signal deltas were detected versus prior fingerprint.",
    watchlist_style: "Use explicit empty-state note when no watchlist items exist."
  },
  changed_run_guidance: {
    summary_focus: "Lead with what changed and the practical monitoring implication.",
    what_changed_style: "Prioritize adds/updates/removals with deterministic identifiers.",
    watchlist_style: "List up to 4 changed signals in deterministic order."
  },
  cta_style_guidance: [
    "Invite custom market signal monitoring and operational triage support.",
    "Keep CTA channel-specific and non-promotional.",
    "Do not mention publishing workflow or approvals."
  ],
  provenance_handling_rules: [
    "Carry forward provenance_references from bulletin-ready artifact unchanged.",
    "Retain citation_refs for refined sections to preserve source traceability.",
    "Do not introduce new factual claims without deterministic source backing."
  ],
  llm_integration: {
    enabled_by_default: false,
    mode: "deterministic-template",
    notes: "This layer is instruction-driven and template-based now; optional LLM mode is deferred."
  }
};
