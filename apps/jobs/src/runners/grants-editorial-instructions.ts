export interface GrantsEditorialInstructions {
  instruction_version: string;
  channel_id: "grants";
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

export const GRANTS_EDITORIAL_INSTRUCTIONS_V1: GrantsEditorialInstructions = {
  instruction_version: "grants-editorial-v1",
  channel_id: "grants",
  tone: "Crisp, operational, and decision-support oriented.",
  compression_style: {
    summary: "Two sentences max. Lead with concrete deterministic status.",
    bullets: "Prefer short bullets with IDs/titles; avoid speculative claims.",
    cta: "One sentence, action-oriented, scoped to grants monitoring support."
  },
  emphasize: [
    "Deterministic status (initial/no_change/changed)",
    "Count-level shifts and watchlist candidates",
    "Near-term action implications for grants monitoring"
  ],
  avoid: [
    "Unverifiable causal claims",
    "Policy/legal interpretation beyond deterministic facts",
    "Cross-channel synthesis or umbrella highlights"
  ],
  no_change_run_guidance: {
    summary_focus: "Reinforce stability and reduced immediate update pressure.",
    what_changed_style: "State that no net change was detected versus prior fingerprint.",
    watchlist_style: "Use explicit empty-state note when no new watchlist items exist."
  },
  changed_run_guidance: {
    summary_focus: "Lead with what changed and the practical monitoring implication.",
    what_changed_style: "Prioritize adds/updates/removals with deterministic identifiers.",
    watchlist_style: "List up to 4 changed opportunities in deterministic order."
  },
  cta_style_guidance: [
    "Invite custom grants tracking/qualification support.",
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
