import { createHash } from "node:crypto";
import type { ManufacturingBulletinReadyArtifact } from "./manufacturing-bulletin-assembler.js";
import {
  MANUFACTURING_EDITORIAL_INSTRUCTIONS_V1,
  type ManufacturingEditorialInstructions
} from "./manufacturing-editorial-instructions.js";

export interface ManufacturingEditorialArtifact {
  channel_id: "manufacturing";
  bulletin_id: string;
  source_bulletin_ready_artifact: {
    bulletin_id: string;
    source_id: string;
    generated_at: string;
    artifact_type: "manufacturing-bulletin-ready";
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
  refined_data_snapshot: ManufacturingBulletinReadyArtifact["data_snapshot"];
  refined_watchlist_1_4_weeks: ManufacturingBulletinReadyArtifact["watchlist_1_4_weeks"];
  provenance_references: ManufacturingBulletinReadyArtifact["provenance_references"];
  publication_metadata: {
    status: "draft";
    issue_date: string;
    slug: string;
    canonical_url: null;
    publish_timestamp: null;
    render_version: "manufacturing-editorial-layer-v1";
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
  bulletin: ManufacturingBulletinReadyArtifact,
  instructions: ManufacturingEditorialInstructions
): string {
  if (bulletin.what_changed.items.length === 0) {
    return "Manufacturing editorial draft generated from deterministic inputs with no section items present.";
  }

  if (bulletin.top_line.body.includes("No-change")) {
    return `No-change run: manufacturing source remains stable versus the prior fingerprint, with supplier monitoring continuity preserved. (${instructions.no_change_run_guidance.summary_focus})`;
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "Initial run: first editorial draft established from the deterministic manufacturing baseline for ongoing operations monitoring.";
  }

  return `Changed run: deterministic manufacturing updates were detected and compressed into an editorial draft focused on near-term supplier and facility actions. (${instructions.changed_run_guidance.summary_focus})`;
}

function refineWhatChangedBody(
  bulletin: ManufacturingBulletinReadyArtifact,
  instructions: ManufacturingEditorialInstructions
): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return `No net manufacturing development deltas were detected relative to the prior snapshot. ${instructions.no_change_run_guidance.what_changed_style}`;
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "Baseline snapshot established; future runs will surface deterministic adds, updates, and removals against this manufacturing foundation.";
  }

  return `Deterministic manufacturing change signals were detected for this period. ${instructions.changed_run_guidance.what_changed_style}`;
}

function refineWhyItMattersBody(bulletin: ManufacturingBulletinReadyArtifact): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return "Stable source output lets teams maintain supplier and network execution plans without immediate reprioritization.";
  }

  if (bulletin.top_line.body.includes("Initial")) {
    return "The initial baseline creates a traceable reference for future supplier-capability and facility-shift triage.";
  }

  return "Detected deltas indicate where sourcing, production planning, and supplier engagement should focus in the near term.";
}

function refineCta(bulletin: ManufacturingBulletinReadyArtifact): string {
  if (bulletin.top_line.body.includes("No-change")) {
    return "If you want higher-confidence monitoring while the feed is stable, Umbrella can run a tailored supplier ecosystem watch for your operating footprint.";
  }

  return "If these manufacturing shifts matter to your operations, Umbrella can deliver custom supplier capability intelligence and ecosystem impact analysis.";
}

function computeContentHash(artifact: Omit<ManufacturingEditorialArtifact, "publication_metadata">): string {
  return createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
}

export function transformManufacturingBulletinToEditorial(params: {
  bulletin: ManufacturingBulletinReadyArtifact;
  instructions?: ManufacturingEditorialInstructions;
}): ManufacturingEditorialArtifact {
  const { bulletin, instructions = MANUFACTURING_EDITORIAL_INSTRUCTIONS_V1 } = params;

  const base: Omit<ManufacturingEditorialArtifact, "publication_metadata"> = {
    channel_id: "manufacturing",
    bulletin_id: bulletin.bulletin_id,
    source_bulletin_ready_artifact: {
      bulletin_id: bulletin.bulletin_id,
      source_id: bulletin.source_id,
      generated_at: bulletin.generated_at,
      artifact_type: "manufacturing-bulletin-ready",
      artifact_filename: `${bulletin.bulletin_id}.bulletin-ready.json`
    },
    generated_at: bulletin.generated_at,
    editorial_instruction_version: instructions.instruction_version,
    editorial_summary: refineSummary(bulletin, instructions),
    refined_top_line: {
      heading: bulletin.top_line.heading,
      body: `${bulletin.top_line.body} Editorial compression applied for manufacturing intelligence decisions.`,
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
      render_version: "manufacturing-editorial-layer-v1",
      content_hash: computeContentHash(base),
      distribution_targets: []
    }
  };
}
