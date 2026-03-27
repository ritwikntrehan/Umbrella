export type UmbrellaChannelId = "grants" | "trade" | "market-signals" | "manufacturing" | "m-and-a";

export interface UmbrellaSynthesisInstructions {
  instruction_version: string;
  layer: "umbrella-synthesis";
  tone: string;
  compression_style: {
    summary: string;
    top_updates: string;
    patterns: string;
  };
  cross_channel_prioritization_logic: string[];
  sparse_input_behavior: {
    no_channel_artifacts: string;
    partial_channels: string;
    low_signal: string;
  };
  emphasize: string[];
  avoid: string[];
  cta_style_guidance: string[];
  provenance_handling_rules: string[];
  llm_integration: {
    enabled_by_default: false;
    mode: "deterministic-template" | "llm";
    notes: string;
  };
}

export const UMBRELLA_SYNTHESIS_INSTRUCTIONS_V1: UmbrellaSynthesisInstructions = {
  instruction_version: "umbrella-synthesis-v1",
  layer: "umbrella-synthesis",
  tone: "Executive-brief and operational, with concise cross-channel decision framing.",
  compression_style: {
    summary: "Two sentences max. Lead with coverage and signal quality.",
    top_updates: "Prioritize actionable updates; keep each line deterministic and source-backed.",
    patterns: "Highlight repeated themes across channels without speculative causality."
  },
  cross_channel_prioritization_logic: [
    "Prefer channels with detected change language over initial/no-change language.",
    "Then prioritize channels with the most watchlist items.",
    "Break ties by latest generated_at timestamp then channel slug lexical order for stability."
  ],
  sparse_input_behavior: {
    no_channel_artifacts:
      "Emit a valid umbrella artifact with empty updates/patterns and a CTA to run channel editorial jobs first.",
    partial_channels:
      "Summarize only available channels and explicitly name missing channels as not yet available.",
    low_signal: "If channels are present but thin, keep summary short and avoid forced pattern claims."
  },
  emphasize: [
    "Cross-channel coverage state and confidence",
    "Top deterministic updates with channel attribution",
    "Repeatable patterns that matter for near-term execution"
  ],
  avoid: [
    "Claims that are not traceable to channel editorial artifacts",
    "Discussion of deployment, publishing workflows, approvals, or archives",
    "Narrative filler that hides sparse or missing channel data"
  ],
  cta_style_guidance: [
    "One sentence, bespoke support framing, no sales-heavy language.",
    "Connect CTA to cross-channel monitoring and triage support.",
    "If sparse input, CTA should include a data-readiness caveat."
  ],
  provenance_handling_rules: [
    "Preserve per-channel bulletin/editorial provenance pointers.",
    "Carry forward channel provenance_references into umbrella provenance with channel labels.",
    "Do not invent new source identifiers or citation references."
  ],
  llm_integration: {
    enabled_by_default: false,
    mode: "deterministic-template",
    notes: "Current layer is deterministic and inspectable; optional LLM-backed synthesis is deferred."
  }
};
