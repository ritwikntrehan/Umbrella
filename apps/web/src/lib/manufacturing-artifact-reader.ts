import { manufacturingChannelConfig, manufacturingSources } from "@umbrella/channel-config";
import { readLatestBulletinReadyArtifact, readLatestEditorialArtifact } from "./artifact-reader-shared.js";

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

export interface ManufacturingEditorialViewModel {
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

export function readLatestManufacturingEditorialForWeb(): ManufacturingEditorialViewModel {
  const sourceId = manufacturingSources[0]?.id ?? "manufacturing-pilot-network";
  const editorial = readLatestEditorialArtifact(sourceId);
  const bulletinReady = readLatestBulletinReadyArtifact(sourceId);

  if (!editorial) {
    return {
      channelLabel: manufacturingChannelConfig.displayName,
      sourceId,
      fallbackReason:
        "No manufacturing editorial artifact found yet. Run the manufacturing pipeline and editorial jobs to populate local content."
    };
  }

  return {
    channelLabel: manufacturingChannelConfig.displayName,
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
