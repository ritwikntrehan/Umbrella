import {
  grantsSources,
  mAndASources,
  manufacturingSources,
  marketSignalsSources,
  tradeSources
} from "@umbrella/channel-config";
import type { ArtifactStore, EditorialArtifact } from "../lib/local-artifact-store.js";
import type { UmbrellaChannelId } from "./umbrella-synthesis-instructions.js";

const UMBRELLA_CHANNEL_ORDER: UmbrellaChannelId[] = ["grants", "trade", "market-signals", "manufacturing", "m-and-a"];

interface SourceArtifactReference {
  source_id: string;
  channel_id: UmbrellaChannelId;
  artifact_type: "channel-editorial";
  artifact_filename: string;
  bulletin_id: string;
  generated_at: string;
}

export interface UmbrellaChannelInput {
  channel_id: UmbrellaChannelId;
  source_id: string;
  channel_label: string;
  artifact_reference: SourceArtifactReference;
  editorial_summary: string;
  top_line: string;
  what_changed_items: string[];
  watchlist_items: string[];
  custom_work_cta: string;
  provenance_references: Array<{ ref_type: string; ref_value: string }>;
}

export interface UmbrellaSynthesisInput {
  expected_channels: UmbrellaChannelId[];
  channels: UmbrellaChannelInput[];
  missing_channels: UmbrellaChannelId[];
}

function getSourceForChannel(channelId: UmbrellaChannelId) {
  if (channelId === "grants") return grantsSources[0];
  if (channelId === "trade") return tradeSources[0];
  if (channelId === "market-signals") return marketSignalsSources[0];
  if (channelId === "manufacturing") return manufacturingSources[0];
  return mAndASources[0];
}

function getDisplayLabel(channelId: UmbrellaChannelId): string {
  if (channelId === "market-signals") return "Market Signals";
  if (channelId === "m-and-a") return "M&A";
  return channelId.charAt(0).toUpperCase() + channelId.slice(1);
}

function normalizeEditorial(channelId: UmbrellaChannelId, sourceId: string, editorial: EditorialArtifact): UmbrellaChannelInput {
  return {
    channel_id: channelId,
    source_id: sourceId,
    channel_label: getDisplayLabel(channelId),
    artifact_reference: {
      source_id: sourceId,
      channel_id: channelId,
      artifact_type: "channel-editorial",
      artifact_filename: `${(editorial as { bulletin_id: string }).bulletin_id}.editorial.json`,
      bulletin_id: (editorial as { bulletin_id: string }).bulletin_id,
      generated_at: (editorial as { generated_at: string }).generated_at
    },
    editorial_summary: (editorial as { editorial_summary?: string }).editorial_summary ?? "",
    top_line: (editorial as { refined_top_line?: { body?: string } }).refined_top_line?.body ?? "",
    what_changed_items: (editorial as { refined_what_changed?: { items?: string[] } }).refined_what_changed?.items ?? [],
    watchlist_items: (editorial as { refined_watchlist_1_4_weeks?: { items?: string[] } | null }).refined_watchlist_1_4_weeks?.items ?? [],
    custom_work_cta: (editorial as { refined_custom_work_cta?: { body?: string } }).refined_custom_work_cta?.body ?? "",
    provenance_references: (editorial as { provenance_references?: Array<{ ref_type: string; ref_value: string }> }).provenance_references ?? []
  };
}

export async function readUmbrellaSynthesisInput(store: ArtifactStore): Promise<UmbrellaSynthesisInput> {
  const channels: UmbrellaChannelInput[] = [];
  const missingChannels: UmbrellaChannelId[] = [];

  for (const channelId of UMBRELLA_CHANNEL_ORDER) {
    const source = getSourceForChannel(channelId);
    if (!source) {
      missingChannels.push(channelId);
      continue;
    }

    const editorial = await store.readLatestEditorialArtifact(source);
    if (!editorial) {
      missingChannels.push(channelId);
      continue;
    }

    channels.push(normalizeEditorial(channelId, source.id, editorial));
  }

  channels.sort((a, b) => a.channel_id.localeCompare(b.channel_id));

  return {
    expected_channels: [...UMBRELLA_CHANNEL_ORDER],
    channels,
    missing_channels: missingChannels
  };
}
