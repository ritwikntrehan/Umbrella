export interface ManufacturingEditorialInstructions {
  instruction_version: string;
  channel_id: "manufacturing";
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

export const MANUFACTURING_EDITORIAL_INSTRUCTIONS_V1: ManufacturingEditorialInstructions = {
  instruction_version: "manufacturing-editorial-v1",
  channel_id: "manufacturing",
  tone: "Concise, industrial, and operations-focused with practical commercial relevance.",
  compression_style: {
    summary: "Two sentences max. Lead with deterministic change status and shop-floor/network relevance.",
    bullets: "Use direct bullets with IDs and titles; prioritize supplier capability and operational movement.",
    cta: "One sentence, advisory-oriented, scoped to manufacturing ecosystem intelligence support."
  },
  emphasize: [
    "Deterministic status (initial/no_change/changed)",
    "Supplier capability and facility development deltas",
    "Operational shifts with near-term planning implications"
  ],
  avoid: [
    "Generic innovation language or strategic fluff",
    "Speculative productivity forecasts beyond deterministic facts",
    "Cross-channel synthesis or umbrella-level rollups"
  ],
  no_change_run_guidance: {
    summary_focus: "Reinforce manufacturing network stability and continuity of current supplier plans.",
    what_changed_style: "State explicitly that no net manufacturing deltas were detected versus prior fingerprint.",
    watchlist_style: "Use an explicit empty-state reason when no watchlist items exist."
  },
  changed_run_guidance: {
    summary_focus: "Lead with capability/facility/operational deltas and immediate planning relevance.",
    what_changed_style: "Prioritize deterministic adds/updates/removals with external identifiers.",
    watchlist_style: "List up to 4 changed manufacturing developments in deterministic order."
  },
  cta_style_guidance: [
    "Invite custom supplier ecosystem analysis and manufacturing intelligence support.",
    "Keep CTA channel-specific, practical, and non-promotional.",
    "Do not mention approvals or publishing workflows."
  ],
  provenance_handling_rules: [
    "Carry forward provenance_references from bulletin-ready artifact unchanged.",
    "Retain citation_refs for refined sections to preserve source traceability.",
    "Do not introduce factual claims not supported by deterministic artifacts."
  ],
  llm_integration: {
    enabled_by_default: false,
    mode: "deterministic-template",
    notes: "This layer remains instruction-driven and template-based; live LLM integration is optional and deferred by default."
  }
};
