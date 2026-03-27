export interface MAndAEditorialInstructions {
  instruction_version: string;
  channel_id: "m-and-a";
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

export const M_AND_A_EDITORIAL_INSTRUCTIONS_V1: MAndAEditorialInstructions = {
  instruction_version: "m-and-a-editorial-v1",
  channel_id: "m-and-a",
  tone: "Concise, commercially sharp, and acquisition-oriented with diligence relevance.",
  compression_style: {
    summary: "Two sentences max. Lead with deterministic status and business assessment consequence.",
    bullets: "Use direct bullets with IDs and titles; prioritize value-creation and diligence impact.",
    cta: "One sentence, advisory and practical, focused on assessment and acquisition intelligence work." 
  },
  emphasize: [
    "Deterministic status (initial/no_change/changed)",
    "Acquisition-relevant business, asset, and operating signal changes",
    "Diligence usefulness and value-creation opportunity framing"
  ],
  avoid: [
    "Generic business commentary without assessment value",
    "Speculative deal claims not grounded in deterministic artifacts",
    "Cross-channel synthesis or umbrella-level rollups"
  ],
  no_change_run_guidance: {
    summary_focus: "Reinforce stability while preserving a disciplined diligence watch posture.",
    what_changed_style: "State explicitly that no net M&A assessment deltas were detected versus prior fingerprint.",
    watchlist_style: "Use an explicit empty-state reason when no watchlist items exist."
  },
  changed_run_guidance: {
    summary_focus: "Lead with assessment-relevant deltas and immediate diligence implications.",
    what_changed_style: "Prioritize deterministic adds/updates/removals with external identifiers.",
    watchlist_style: "List up to 4 changed business assessment signals in deterministic order."
  },
  cta_style_guidance: [
    "Invite custom diligence support, business assessment, and acquisition intelligence work.",
    "Keep CTA channel-specific, practical, and commercially grounded.",
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
