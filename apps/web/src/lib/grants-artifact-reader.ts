import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { grantsChannelConfig, grantsSources } from "@umbrella/channel-config";

interface ArtifactEnvelope<T> {
  sourceId: string;
  createdAt: string;
  payload: T;
}

interface EditorialSection {
  heading: string;
  body: string;
  items?: string[];
  citation_refs?: string[];
}

interface BulletinPeriod {
  start_date: string;
  end_date: string;
  label: string;
}

interface PublicationMetadata {
  status?: string;
  issue_date?: string;
  slug?: string;
}

export interface GrantsEditorialViewModel {
  channelLabel: string;
  sourceId: string;
  generatedAt?: string;
  bulletinId?: string;
  bulletinPeriod?: BulletinPeriod;
  editorialSummary?: string;
  refinedTopLine?: EditorialSection;
  refinedWhatChanged?: EditorialSection;
  refinedWhyItMatters?: EditorialSection;
  refinedCustomWorkCta?: EditorialSection;
  refinedWatchlist?: { items: string[]; empty_state_reason?: string } | null;
  refinedDataSnapshot?: {
    total_records: number;
    added_records: number;
    updated_records: number;
    removed_records: number;
    source_name: string;
    source_url: string;
    source_adapter: string;
  } | null;
  provenanceReferences?: Array<{ ref_type: string; ref_value: string }>;
  publicationMetadata?: PublicationMetadata;
  fallbackReason?: string;
}

function getDataRootDir(): string {
  return process.env.UMBRELLA_DATA_DIR ?? join(process.cwd(), "data", "grants-pilot");
}

function parseArtifactEnvelope<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, "utf8");
    const parsed = JSON.parse(content) as ArtifactEnvelope<T>;
    return parsed.payload;
  } catch {
    return null;
  }
}

function readLatestEditorialArtifact(sourceId: string): any | null {
  const path = join(getDataRootDir(), "published", sourceId, "latest.editorial.json");
  return parseArtifactEnvelope(path);
}

function readLatestBulletinReadyArtifact(sourceId: string): any | null {
  const path = join(getDataRootDir(), "published", sourceId, "latest.bulletin-ready.json");
  return parseArtifactEnvelope(path);
}

export function readLatestGrantsEditorialForWeb(): GrantsEditorialViewModel {
  const sourceId = grantsSources[0]?.id ?? "grants-fed-notices";
  const editorial = readLatestEditorialArtifact(sourceId);
  const bulletinReady = readLatestBulletinReadyArtifact(sourceId);

  if (!editorial) {
    return {
      channelLabel: grantsChannelConfig.displayName,
      sourceId,
      fallbackReason:
        "No grants editorial artifact found yet. Run the grants pipeline and editorial jobs to populate local content."
    };
  }

  return {
    channelLabel: grantsChannelConfig.displayName,
    sourceId,
    generatedAt: editorial.generated_at,
    bulletinId: editorial.bulletin_id,
    bulletinPeriod: bulletinReady?.bulletin_period,
    editorialSummary: editorial.editorial_summary,
    refinedTopLine: editorial.refined_top_line,
    refinedWhatChanged: editorial.refined_what_changed,
    refinedWhyItMatters: editorial.refined_why_it_matters,
    refinedCustomWorkCta: editorial.refined_custom_work_cta,
    refinedWatchlist: editorial.refined_watchlist_1_4_weeks,
    refinedDataSnapshot: editorial.refined_data_snapshot,
    provenanceReferences: editorial.provenance_references,
    publicationMetadata: editorial.publication_metadata
  };
}
