import { createHash } from "node:crypto";
import type { MarketSignalsBulletinReadyArtifact } from "./market-signals-bulletin-assembler.js";
import {
  MARKET_SIGNALS_EDITORIAL_INSTRUCTIONS_V1,
  type MarketSignalsEditorialInstructions
} from "./market-signals-editorial-instructions.js";

export interface MarketSignalsEditorialArtifact {
  channel_id: "market-signals";
  bulletin_id: string;
  source_bulletin_ready_artifact: {
    bulletin_id: string;
    source_id: string;
    generated_at: string;
    artifact_type: "market-signals-bulletin-ready";
    artifact_filename: string;
  };
  generated_at: string;
  editorial_instruction_version: string;
  editorial_summary: string;
  refined_top_line: {
    heading: string;
    body: string;
    citation_refs: string[];
  };
  refined_what_changed: {
    heading: string;
    body: string;
    items: string[];
    citation_refs: string[];
  };
  refined_why_it_matters: {
    heading: string;
    body: string;
    items: string[];
    citation_refs: string[];
  };
  refined_custom_work_cta: {
    heading: string;
    body: string;
    citation_refs: string[];
  };
  refined_data_snapshot: MarketSignalsBulletinReadyArtifact["data_snapshot"];
  refined_watchlist_1_4_weeks: MarketSignalsBulletinReadyArtifact["watchlist_1_4_weeks"];
  provenance_references: MarketSignalsBulletinReadyArtifact["provenance_references"];
  publication_metadata: {
    status: "draft";
    issue_date: string;
    slug: string;
    canonical_url: null;
    publish_timestamp: null;
    render_version: "market-signals-editorial-layer-v1";
    content_hash: string;
    distribution_targets: [];
  };
  editorial_metadata: {
    synthesis_mode: "deterministic-template";
    llm_enabled: false;
    instruction_notes: string;
  };
  schema_version: "1.0.0";
}

function refineSummary(
  bulletin: MarketSignalsBulletinReadyArtifact,
  instructions: MarketSignalsEditorialInstructions
): string {
  if (bulletin.what_changed.items.length === 0) {
    return "Market-signals editorial draft generated from deterministic inputs with no section items present.";
  }

  if (bulletin.top_line.body.includes("No-change")) {
    return `No-change run: market-signals source remains stable versus the prior fingerprint, with monitoring continuity preserved. (${instructions.no_change_run_guidance.summary_focus})`;
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "Initial run: first editorial draft established from the deterministic market-signals baseline for ongoing monitoring.";
  }

  return `Changed run: deterministic updates were detected and compressed into an editorial draft focused on near-term market monitoring actions. (${instructions.changed_run_guidance.summary_focus})`;
}

function refineWhatChangedBody(
  bulletin: MarketSignalsBulletinReadyArtifact,
  instructions: MarketSignalsEditorialInstructions
): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return `No net market signal deltas were detected relative to the prior snapshot. ${instructions.no_change_run_guidance.what_changed_style}`;
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "Baseline snapshot established; future runs will surface deterministic adds, updates, and removals against this foundation.";
  }

  return `Deterministic change signals were detected for this period. ${instructions.changed_run_guidance.what_changed_style}`;
}

function refineWhyItMattersBody(bulletin: MarketSignalsBulletinReadyArtifact): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return "Stable source output lets teams maintain existing market-monitoring priorities without immediate reprioritization.";
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "The initial baseline provides a traceable reference point for future market-signal triage and execution planning.";
  }

  return "Detected deltas identify where teams should focus near-term pricing, freight, and inventory review cycles.";
}

function refineCta(bulletin: MarketSignalsBulletinReadyArtifact): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return "If you want higher-confidence monitoring while the feed is stable, Umbrella can run a tailored market-signals watch and triage cadence.";
  }

  return "If these signals matter to your operations, Umbrella can tailor market monitoring, filtering, and triage support to your team.";
}

function computeContentHash(artifact: Omit<MarketSignalsEditorialArtifact, "publication_metadata">): string {
  return createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
}

export function transformMarketSignalsBulletinToEditorial(params: {
  bulletin: MarketSignalsBulletinReadyArtifact;
  instructions?: MarketSignalsEditorialInstructions;
}): MarketSignalsEditorialArtifact {
  const { bulletin, instructions = MARKET_SIGNALS_EDITORIAL_INSTRUCTIONS_V1 } = params;

  const base: Omit<MarketSignalsEditorialArtifact, "publication_metadata"> = {
    channel_id: "market-signals",
    bulletin_id: bulletin.bulletin_id,
    source_bulletin_ready_artifact: {
      bulletin_id: bulletin.bulletin_id,
      source_id: bulletin.source_id,
      generated_at: bulletin.generated_at,
      artifact_type: "market-signals-bulletin-ready",
      artifact_filename: `${bulletin.bulletin_id}.bulletin-ready.json`
    },
    generated_at: bulletin.generated_at,
    editorial_instruction_version: instructions.instruction_version,
    editorial_summary: refineSummary(bulletin, instructions),
    refined_top_line: {
      heading: bulletin.top_line.heading,
      body: `${bulletin.top_line.body} Editorial compression applied for market-monitoring decisions.`,
      citation_refs: bulletin.top_line.citation_refs
    },
    refined_what_changed: {
      heading: bulletin.what_changed.heading,
      body: refineWhatChangedBody(bulletin, instructions),
      items: bulletin.what_changed.items,
      citation_refs: bulletin.what_changed.citation_refs
    },
    refined_why_it_matters: {
      heading: bulletin.why_it_matters.heading,
      body: refineWhyItMattersBody(bulletin),
      items: bulletin.why_it_matters.items,
      citation_refs: bulletin.why_it_matters.citation_refs
    },
    refined_custom_work_cta: {
      heading: bulletin.custom_work_cta.heading,
      body: refineCta(bulletin),
      citation_refs: bulletin.custom_work_cta.citation_refs
    },
    refined_data_snapshot: bulletin.data_snapshot,
    refined_watchlist_1_4_weeks: bulletin.watchlist_1_4_weeks,
    provenance_references: bulletin.provenance_references,
    editorial_metadata: {
      synthesis_mode: "deterministic-template",
      llm_enabled: false,
      instruction_notes: instructions.llm_integration.notes
    },
    schema_version: "1.0.0"
  };

  return {
    ...base,
    publication_metadata: {
      status: "draft",
      issue_date: bulletin.publication_metadata.issue_date,
      slug: `${bulletin.publication_metadata.slug}-editorial`,
      canonical_url: null,
      publish_timestamp: null,
      render_version: "market-signals-editorial-layer-v1",
      content_hash: computeContentHash(base),
      distribution_targets: []
    }
  };
}
