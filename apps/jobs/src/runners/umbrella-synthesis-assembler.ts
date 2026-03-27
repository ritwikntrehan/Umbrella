import { createHash } from "node:crypto";
import type { UmbrellaSynthesisInput } from "./umbrella-synthesis-input-reader.js";
import {
  UMBRELLA_SYNTHESIS_INSTRUCTIONS_V1,
  type UmbrellaChannelId,
  type UmbrellaSynthesisInstructions
} from "./umbrella-synthesis-instructions.js";

export interface UmbrellaSynthesisArtifact {
  umbrella_artifact_id: string;
  generated_at: string;
  source_channel_artifacts: Array<{
    source_id: string;
    channel_id: UmbrellaChannelId;
    artifact_type: "channel-editorial";
    artifact_filename: string;
    bulletin_id: string;
    generated_at: string;
  }>;
  included_channels: UmbrellaChannelId[];
  missing_channels: UmbrellaChannelId[];
  top_updates_across_channels: string[];
  short_umbrella_summary: string;
  notable_patterns: string[];
  custom_work_cta: string;
  provenance_references: Array<{ ref_type: string; ref_value: string }>;
  publication_metadata: {
    status: "draft";
    issue_date: string;
    slug: string;
    canonical_url: null;
    publish_timestamp: null;
    render_version: "umbrella-synthesis-layer-v1";
    content_hash: string;
    distribution_targets: [];
  };
  synthesis_metadata: {
    synthesis_mode: "deterministic-template";
    llm_enabled: false;
    instruction_version: string;
    instruction_notes: string;
  };
  schema_version: "1.0.0";
}

interface PrioritizedChannel {
  channel_id: UmbrellaChannelId;
  signal_score: number;
  watchlist_count: number;
  generated_at: string;
  top_line: string;
  summary: string;
}

function deterministicScore(topLine: string): number {
  const lower = topLine.toLowerCase();
  if (lower.includes("changed") || lower.includes("update") || lower.includes("detected")) return 3;
  if (lower.includes("initial")) return 2;
  if (lower.includes("no-change") || lower.includes("no change") || lower.includes("stable")) return 1;
  return 0;
}

function prioritize(input: UmbrellaSynthesisInput): PrioritizedChannel[] {
  return input.channels
    .map((channel) => ({
      channel_id: channel.channel_id,
      signal_score: deterministicScore(channel.top_line),
      watchlist_count: channel.watchlist_items.length,
      generated_at: channel.artifact_reference.generated_at,
      top_line: channel.top_line,
      summary: channel.editorial_summary
    }))
    .sort((a, b) => {
      if (b.signal_score !== a.signal_score) return b.signal_score - a.signal_score;
      if (b.watchlist_count !== a.watchlist_count) return b.watchlist_count - a.watchlist_count;
      if (b.generated_at !== a.generated_at) return b.generated_at.localeCompare(a.generated_at);
      return a.channel_id.localeCompare(b.channel_id);
    });
}

function deriveTopUpdates(input: UmbrellaSynthesisInput): string[] {
  const prioritized = prioritize(input);
  return prioritized.slice(0, 5).map((channel) => {
    const item = input.channels.find((entry) => entry.channel_id === channel.channel_id);
    const firstWhatChanged = item?.what_changed_items[0];
    const detail = firstWhatChanged || channel.top_line || channel.summary || "Deterministic update available.";
    return `[${channel.channel_id}] ${detail}`;
  });
}

function deriveNotablePatterns(input: UmbrellaSynthesisInput): string[] {
  if (input.channels.length === 0) {
    return [];
  }

  const channelsWithWatchlist = input.channels.filter((entry) => entry.watchlist_items.length > 0).map((entry) => entry.channel_id);
  const channelsWithChanges = input.channels
    .filter((entry) => entry.what_changed_items.length > 0 || deterministicScore(entry.top_line) >= 2)
    .map((entry) => entry.channel_id);

  const patterns: string[] = [];

  if (channelsWithChanges.length >= 2) {
    patterns.push(`Change activity is visible across ${channelsWithChanges.length} channels: ${channelsWithChanges.join(", ")}.`);
  }

  if (channelsWithWatchlist.length >= 2) {
    patterns.push(`Near-term watchlist pressure spans ${channelsWithWatchlist.length} channels: ${channelsWithWatchlist.join(", ")}.`);
  }

  if (patterns.length === 0) {
    patterns.push("Cross-channel signals are currently light; maintain baseline monitoring across available channels.");
  }

  return patterns.slice(0, 3);
}

function deriveSummary(input: UmbrellaSynthesisInput): string {
  if (input.channels.length === 0) {
    return "No channel editorial artifacts are currently available. Run the five channel editorial jobs, then regenerate umbrella synthesis.";
  }

  if (input.missing_channels.length > 0) {
    return `Umbrella synthesis generated from ${input.channels.length}/5 channels. Missing channels: ${input.missing_channels.join(", ")}.`;
  }

  return "Umbrella synthesis generated from all five channels with deterministic prioritization of the most actionable updates.";
}

function deriveCta(input: UmbrellaSynthesisInput): string {
  if (input.channels.length === 0) {
    return "Need help bootstrapping cross-channel monitoring? Umbrella can set up a deterministic triage baseline once source artifacts are present.";
  }

  if (input.missing_channels.length > 0) {
    return "If you need complete cross-channel coverage, Umbrella can help close data gaps and run integrated monitoring across all active channels.";
  }

  return "If these updates affect your roadmap, Umbrella can deliver a tailored cross-channel triage brief and execution support plan.";
}

function deriveProvenance(input: UmbrellaSynthesisInput): Array<{ ref_type: string; ref_value: string }> {
  const refs = input.channels.flatMap((channel) => [
    {
      ref_type: "source_channel_artifact",
      ref_value: `${channel.channel_id}:${channel.artifact_reference.artifact_filename}`
    },
    ...channel.provenance_references.map((ref) => ({ ref_type: `${channel.channel_id}:${ref.ref_type}`, ref_value: ref.ref_value }))
  ]);

  return refs.sort((a, b) => `${a.ref_type}:${a.ref_value}`.localeCompare(`${b.ref_type}:${b.ref_value}`));
}

function computeContentHash(artifact: Omit<UmbrellaSynthesisArtifact, "publication_metadata">): string {
  return createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
}

export function assembleUmbrellaSynthesisArtifact(params: {
  input: UmbrellaSynthesisInput;
  now?: string;
  instructions?: UmbrellaSynthesisInstructions;
}): UmbrellaSynthesisArtifact {
  const { input, instructions = UMBRELLA_SYNTHESIS_INSTRUCTIONS_V1 } = params;
  const generatedAt = params.now ?? new Date().toISOString();
  const issueDate = generatedAt.slice(0, 10);

  const base: Omit<UmbrellaSynthesisArtifact, "publication_metadata"> = {
    umbrella_artifact_id: `umbrella-synthesis-${issueDate}`,
    generated_at: generatedAt,
    source_channel_artifacts: input.channels.map((channel) => channel.artifact_reference),
    included_channels: input.channels.map((channel) => channel.channel_id),
    missing_channels: input.missing_channels,
    top_updates_across_channels: deriveTopUpdates(input),
    short_umbrella_summary: deriveSummary(input),
    notable_patterns: deriveNotablePatterns(input),
    custom_work_cta: deriveCta(input),
    provenance_references: deriveProvenance(input),
    synthesis_metadata: {
      synthesis_mode: "deterministic-template",
      llm_enabled: false,
      instruction_version: instructions.instruction_version,
      instruction_notes: instructions.llm_integration.notes
    },
    schema_version: "1.0.0"
  };

  return {
    ...base,
    publication_metadata: {
      status: "draft",
      issue_date: issueDate,
      slug: `umbrella-synthesis-${issueDate}`,
      canonical_url: null,
      publish_timestamp: null,
      render_version: "umbrella-synthesis-layer-v1",
      content_hash: computeContentHash(base),
      distribution_targets: []
    }
  };
}
