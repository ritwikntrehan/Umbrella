import { createHash } from "node:crypto";
import type { GrantsBulletinReadyArtifact } from "./grants-bulletin-assembler.js";
import {
  GRANTS_EDITORIAL_INSTRUCTIONS_V1,
  type GrantsEditorialInstructions
} from "./grants-editorial-instructions.js";

export interface GrantsEditorialArtifact {
  channel_id: "grants";
  bulletin_id: string;
  source_bulletin_ready_artifact: {
    bulletin_id: string;
    source_id: string;
    generated_at: string;
    artifact_type: "grants-bulletin-ready";
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
  refined_data_snapshot: GrantsBulletinReadyArtifact["data_snapshot"];
  refined_watchlist_1_4_weeks: GrantsBulletinReadyArtifact["watchlist_1_4_weeks"];
  provenance_references: GrantsBulletinReadyArtifact["provenance_references"];
  publication_metadata: {
    status: "draft";
    issue_date: string;
    slug: string;
    canonical_url: null;
    publish_timestamp: null;
    render_version: "grants-editorial-layer-v1";
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
  bulletin: GrantsBulletinReadyArtifact,
  instructions: GrantsEditorialInstructions
): string {
  if (bulletin.what_changed.items.length === 0) {
    return "Grants editorial draft generated from deterministic inputs with no section items present.";
  }

  if (bulletin.top_line.body.includes("No-change")) {
    return `No-change run: grants source remains stable versus the prior fingerprint, with monitoring continuity preserved. (${instructions.no_change_run_guidance.summary_focus})`;
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "Initial run: first editorial draft established from the deterministic grants baseline for ongoing monitoring.";
  }

  return `Changed run: deterministic updates were detected and compressed into an editorial draft focused on near-term monitoring actions. (${instructions.changed_run_guidance.summary_focus})`;
}

function refineWhatChangedBody(
  bulletin: GrantsBulletinReadyArtifact,
  instructions: GrantsEditorialInstructions
): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return `No net grant opportunity deltas were detected relative to the prior snapshot. ${instructions.no_change_run_guidance.what_changed_style}`;
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "Baseline snapshot established; future runs will surface deterministic adds, updates, and removals against this foundation.";
  }

  return `Deterministic change signals were detected for this period. ${instructions.changed_run_guidance.what_changed_style}`;
}

function refineWhyItMattersBody(bulletin: GrantsBulletinReadyArtifact): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return "Stable source output lets teams maintain existing grant pursuit priorities without immediate reprioritization.";
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "The initial baseline provides a traceable reference point for future grant-change triage and execution planning.";
  }

  return "Detected deltas identify where teams should focus review cycles, qualification checks, and application readiness in the near term.";
}

function refineCta(bulletin: GrantsBulletinReadyArtifact): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return "If you want higher-confidence monitoring while the feed is stable, Umbrella can run a tailored grants watch and qualification cadence.";
  }

  return "If these changes matter to your pipeline, Umbrella can tailor grant monitoring, filtering, and qualification support to your team.";
}

function computeContentHash(artifact: Omit<GrantsEditorialArtifact, "publication_metadata">): string {
  return createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
}

export function transformGrantsBulletinToEditorial(params: {
  bulletin: GrantsBulletinReadyArtifact;
  instructions?: GrantsEditorialInstructions;
}): GrantsEditorialArtifact {
  const { bulletin, instructions = GRANTS_EDITORIAL_INSTRUCTIONS_V1 } = params;

  const base: Omit<GrantsEditorialArtifact, "publication_metadata"> = {
    channel_id: "grants",
    bulletin_id: bulletin.bulletin_id,
    source_bulletin_ready_artifact: {
      bulletin_id: bulletin.bulletin_id,
      source_id: bulletin.source_id,
      generated_at: bulletin.generated_at,
      artifact_type: "grants-bulletin-ready",
      artifact_filename: `${bulletin.bulletin_id}.bulletin-ready.json`
    },
    generated_at: bulletin.generated_at,
    editorial_instruction_version: instructions.instruction_version,
    editorial_summary: refineSummary(bulletin, instructions),
    refined_top_line: {
      heading: bulletin.top_line.heading,
      body: `${bulletin.top_line.body} Editorial compression applied for grant-monitoring decisions.`,
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
      render_version: "grants-editorial-layer-v1",
      content_hash: computeContentHash(base),
      distribution_targets: []
    }
  };
}
