import { createHash } from "node:crypto";
import type { Source } from "@umbrella/core";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { BulletinPeriod, BulletinSectionContent } from "./grants-bulletin-assembler.js";
import type { MarketSignalsChangeEvent } from "./change-detection-runner.js";

export interface MarketSignalsBulletinReadyArtifact {
  bulletin_id: string;
  channel_id: "market-signals";
  source_id: string;
  bulletin_period: BulletinPeriod;
  generated_at: string;
  top_line: BulletinSectionContent;
  what_changed: BulletinSectionContent & { items: string[] };
  why_it_matters: BulletinSectionContent & { items: string[] };
  custom_work_cta: BulletinSectionContent;
  data_snapshot: {
    total_records: number;
    added_records: number;
    updated_records: number;
    removed_records: number;
    source_name: string;
    source_url: string;
    source_adapter: string;
  } | null;
  watchlist_1_4_weeks: {
    items: string[];
    empty_state_reason?: string;
  } | null;
  record_references: Array<{
    external_id: string;
    title: string;
    published_at: string | null;
  }>;
  provenance_references: Array<{
    ref_type: "change_event_id" | "change_fingerprint" | "normalized_record_external_id";
    ref_value: string;
  }>;
  publication_metadata: {
    status: "draft";
    issue_date: string;
    slug: string;
    canonical_url: null;
    publish_timestamp: null;
    render_version: "deterministic-market-signals-bulletin-v1";
    content_hash: string;
    distribution_targets: [];
  };
  schema_version: "1.0.0";
}

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function computeBulletinPeriod(records: NormalizedRecord[], detectedAt: string): BulletinPeriod {
  const publishedDates = records
    .map((record) => record.publishedAt)
    .filter((value): value is string => typeof value === "string")
    .map(toDateOnly)
    .sort();

  const fallbackDate = toDateOnly(detectedAt);
  const startDate = publishedDates[0] ?? fallbackDate;
  const endDate = publishedDates[publishedDates.length - 1] ?? fallbackDate;

  return {
    start_date: startDate,
    end_date: endDate,
    label: startDate === endDate ? startDate : `${startDate} to ${endDate}`
  };
}

function buildWhatChangedItems(changeEvent: MarketSignalsChangeEvent): string[] {
  if (changeEvent.status === "no_change") {
    return ["No net changes were detected against the prior market-signals snapshot."];
  }

  const items: string[] = [];
  if (changeEvent.status === "initial") {
    items.push("Initial deterministic market-signals baseline captured for this source.");
  }
  if (changeEvent.addedExternalIds.length > 0) {
    items.push(`Added signals: ${changeEvent.addedExternalIds.join(", ")}.`);
  }
  if (changeEvent.updatedExternalIds.length > 0) {
    items.push(`Updated signals: ${changeEvent.updatedExternalIds.join(", ")}.`);
  }
  if (changeEvent.removedExternalIds.length > 0) {
    items.push(`Removed signals: ${changeEvent.removedExternalIds.join(", ")}.`);
  }

  return items.length > 0 ? items : ["Changes detected in fingerprint, with no net adds/removals."];
}

function buildWhyItMattersItems(changeEvent: MarketSignalsChangeEvent, recordCount: number): string[] {
  if (changeEvent.status === "no_change") {
    return [
      "A stable market-signals snapshot reduces immediate triage pressure for operating teams.",
      `Current monitor set remains at ${recordCount} tracked market signal record(s).`
    ];
  }

  return [
    "Deterministic signal changes identify where near-term pricing, freight, or inventory monitoring should focus.",
    `This run tracks ${recordCount} market signal record(s) with provenance-linked change references.`
  ];
}

function computeTopLine(changeEvent: MarketSignalsChangeEvent): string {
  if (changeEvent.status === "initial") {
    return "Initial market-signals bulletin baseline assembled from deterministic pipeline outputs.";
  }
  if (changeEvent.status === "no_change") {
    return "No-change market-signals bulletin: source is stable versus the prior deterministic snapshot.";
  }
  return "Market-signals bulletin updated: deterministic pipeline detected meaningful source changes.";
}

function computeWatchlist(
  records: NormalizedRecord[],
  changeEvent: MarketSignalsChangeEvent
): MarketSignalsBulletinReadyArtifact["watchlist_1_4_weeks"] {
  if (changeEvent.status === "no_change") {
    return {
      items: [],
      empty_state_reason: "No new or updated market signals detected in this run."
    };
  }

  const changedIds = new Set([...changeEvent.addedExternalIds, ...changeEvent.updatedExternalIds]);
  const items = records
    .filter((record) => changedIds.has(record.externalId))
    .slice(0, 4)
    .map((record) => `${record.externalId}: ${record.title}`);

  if (items.length === 0) {
    return {
      items: [],
      empty_state_reason: "No watchlist candidates matched changed identifiers."
    };
  }

  return { items };
}

function computeContentHash(artifact: Omit<MarketSignalsBulletinReadyArtifact, "publication_metadata">): string {
  return createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
}

export function assembleMarketSignalsBulletinArtifact(params: {
  source: Source;
  changeEvent: MarketSignalsChangeEvent;
  normalizedRecords: NormalizedRecord[];
}): MarketSignalsBulletinReadyArtifact {
  const { source, changeEvent, normalizedRecords } = params;
  const bulletinPeriod = computeBulletinPeriod(normalizedRecords, changeEvent.detectedAt);
  const recordReferences = normalizedRecords
    .map((record) => ({
      external_id: record.externalId,
      title: record.title,
      published_at: record.publishedAt ?? null
    }))
    .sort((a, b) => a.external_id.localeCompare(b.external_id));

  const artifactBase: Omit<MarketSignalsBulletinReadyArtifact, "publication_metadata"> = {
    bulletin_id: `bulletin-market-signals-${source.id}-${bulletinPeriod.end_date}`,
    channel_id: "market-signals",
    source_id: source.id,
    bulletin_period: bulletinPeriod,
    generated_at: changeEvent.detectedAt,
    top_line: {
      heading: "Top line",
      body: computeTopLine(changeEvent),
      citation_refs: [changeEvent.id]
    },
    what_changed: {
      heading: "What changed",
      body: "Deterministic market-signals change summary for this bulletin period.",
      citation_refs: [changeEvent.id],
      items: buildWhatChangedItems(changeEvent)
    },
    why_it_matters: {
      heading: "Why it matters",
      body: "Deterministic market-signals impact framing prior to editorial intelligence refinement.",
      citation_refs: [changeEvent.id],
      items: buildWhyItMattersItems(changeEvent, normalizedRecords.length)
    },
    custom_work_cta: {
      heading: "Custom work CTA",
      body: "Need tailored market signal monitoring for pricing, freight, or inventory risk? Contact Umbrella for a custom market-signals workflow.",
      citation_refs: [changeEvent.id]
    },
    data_snapshot:
      normalizedRecords.length === 0
        ? null
        : {
            total_records: normalizedRecords.length,
            added_records: changeEvent.addedExternalIds.length,
            updated_records: changeEvent.updatedExternalIds.length,
            removed_records: changeEvent.removedExternalIds.length,
            source_name: source.name,
            source_url: source.url,
            source_adapter: source.adapterKey
          },
    watchlist_1_4_weeks: computeWatchlist(normalizedRecords, changeEvent),
    record_references: recordReferences,
    provenance_references: [
      { ref_type: "change_event_id", ref_value: changeEvent.id },
      { ref_type: "change_fingerprint", ref_value: changeEvent.currentFingerprint },
      ...recordReferences.map((record) => ({
        ref_type: "normalized_record_external_id" as const,
        ref_value: record.external_id
      }))
    ],
    schema_version: "1.0.0"
  };

  return {
    ...artifactBase,
    publication_metadata: {
      status: "draft",
      issue_date: bulletinPeriod.end_date,
      slug: `market-signals-${source.id}-${bulletinPeriod.end_date}`,
      canonical_url: null,
      publish_timestamp: null,
      render_version: "deterministic-market-signals-bulletin-v1",
      content_hash: computeContentHash(artifactBase),
      distribution_targets: []
    }
  };
}
