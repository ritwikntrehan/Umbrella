import { createHash } from "node:crypto";
import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord, SourceAdapter } from "../types.js";

interface GrantsGovOpportunity {
  opportunityId?: string;
  opportunityNumber?: string;
  id?: string;
  title?: string;
  opportunityTitle?: string;
  summary?: string;
  synopsis?: string;
  description?: string;
  agency?: string;
  agencyName?: string;
  amountUsd?: number;
  awardCeiling?: number;
  postedDate?: string;
  postDate?: string;
  publishedAt?: string;
  dueDate?: string;
  closeDate?: string;
  category?: string;
}

interface GrantsGovFeed {
  generatedAt: string;
  opportunities: GrantsGovOpportunity[];
}

const FIXTURE_FEEDS: Record<string, GrantsGovFeed> = {
  base: {
    generatedAt: "2026-03-25T00:00:00.000Z",
    opportunities: [
      {
        opportunityId: "DOE-001",
        title: "Battery Supply Chain Pilot",
        summary: "Pilot funding opportunity for domestic battery component suppliers.",
        agency: "Department of Energy",
        amountUsd: 2000000,
        postedDate: "2026-03-24",
        dueDate: "2026-05-01",
        category: "infrastructure"
      }
    ]
  },
  changed: {
    generatedAt: "2026-03-26T00:00:00.000Z",
    opportunities: [
      {
        opportunityId: "DOE-001",
        title: "Battery Supply Chain Pilot",
        synopsis: "Pilot funding opportunity for domestic battery component suppliers.",
        agencyName: "Department of Energy",
        awardCeiling: 2500000,
        postDate: "2026-03-24",
        closeDate: "2026-05-15",
        category: "infrastructure"
      },
      {
        opportunityNumber: "USDA-010",
        opportunityTitle: "Rural Processing Modernization",
        description: "Capital grants for modernization of rural food processing sites.",
        agency: "USDA",
        amountUsd: 800000,
        postedDate: "2026-03-26",
        dueDate: "2026-06-30",
        category: "rural-development"
      }
    ]
  },
  edge: {
    generatedAt: "2026-03-27T00:00:00.000Z",
    opportunities: [
      {
        id: "  EDGE-001 ",
        title: "  ",
        summary: "  Multi-line   summary\twith extra whitespace. ",
        agency: "DOC",
        amountUsd: 125000,
        publishedAt: "2026-03-27T14:30:00.000Z",
        closeDate: "not-a-date"
      },
      {
        opportunityNumber: "EDGE-001",
        opportunityTitle: "Precision Manufacturing Transition Grant",
        synopsis: "Higher-fidelity duplicate that should win deterministic dedupe.",
        agencyName: "Department of Commerce",
        awardCeiling: 250000,
        postDate: "2026-03-27",
        dueDate: "2026-04-30"
      },
      {
        title: "Missing Identifier Should Be Dropped",
        agency: "Test Agency"
      }
    ]
  }
};

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function toIsoTimestamp(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toDateOnly(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const iso = toIsoTimestamp(value);
  return iso?.slice(0, 10);
}

function sanitizeText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const sanitized = value.replace(/\s+/g, " ").trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

function chooseIdentifier(opportunity: GrantsGovOpportunity): string | undefined {
  return sanitizeText(opportunity.opportunityId ?? opportunity.opportunityNumber ?? opportunity.id);
}

function normalizeOpportunity(opportunity: GrantsGovOpportunity): NormalizedRecord | undefined {
  const externalId = chooseIdentifier(opportunity);
  if (!externalId) return undefined;

  const title =
    sanitizeText(opportunity.title) ??
    sanitizeText(opportunity.opportunityTitle) ??
    `Untitled grant ${externalId}`;
  const summary = sanitizeText(opportunity.summary ?? opportunity.synopsis ?? opportunity.description);

  const amountValue = opportunity.amountUsd ?? opportunity.awardCeiling;
  const amountUsd = typeof amountValue === "number" && Number.isFinite(amountValue) ? amountValue : undefined;

  return {
    externalId,
    title,
    summary,
    publishedAt: toDateOnly(opportunity.postedDate ?? opportunity.postDate ?? opportunity.publishedAt),
    payload: {
      agency: sanitizeText(opportunity.agency ?? opportunity.agencyName) ?? "Unknown agency",
      amountUsd: amountUsd ?? null,
      dueDate: toDateOnly(opportunity.dueDate ?? opportunity.closeDate) ?? null,
      category: sanitizeText(opportunity.category) ?? null
    }
  };
}

async function parseFeed(source: Source): Promise<GrantsGovFeed> {
  const url = new URL(source.url);
  const fixture = url.searchParams.get("fixture");

  if (fixture && FIXTURE_FEEDS[fixture]) {
    return FIXTURE_FEEDS[fixture];
  }

  const response = await fetch(source.url, {
    headers: {
      accept: "application/json",
      "user-agent": "umbrella-jobs/0.1 grants-gov-adapter"
    }
  });

  if (!response.ok) {
    throw new Error(`GrantsGovAdapter fetch failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const opportunitiesRaw =
    (Array.isArray(payload.opportunities) && payload.opportunities) ||
    (Array.isArray(payload.results) && payload.results) ||
    (Array.isArray(payload.data) && payload.data) ||
    (Array.isArray(payload.items) && payload.items) ||
    [];

  const generatedAtValue = typeof payload.generatedAt === "string" ? payload.generatedAt : new Date().toISOString();
  const generatedAt = toIsoTimestamp(generatedAtValue) ?? new Date().toISOString();

  return {
    generatedAt,
    opportunities: opportunitiesRaw as GrantsGovOpportunity[]
  };
}

function normalizeFeed(feed: GrantsGovFeed): NormalizedRecord[] {
  const deduped = new Map<string, NormalizedRecord>();

  for (const opportunity of feed.opportunities) {
    const normalized = normalizeOpportunity(opportunity);
    if (!normalized) continue;

    const existing = deduped.get(normalized.externalId);
    if (!existing) {
      deduped.set(normalized.externalId, normalized);
      continue;
    }

    const existingSummaryLength = existing.summary?.length ?? 0;
    const nextSummaryLength = normalized.summary?.length ?? 0;
    deduped.set(normalized.externalId, nextSummaryLength >= existingSummaryLength ? normalized : existing);
  }

  return [...deduped.values()].sort((a, b) => a.externalId.localeCompare(b.externalId));
}

export class GrantsGovAdapter implements SourceAdapter {
  readonly key = "grants-gov-feed";
  private readonly cache = new Map<string, NormalizedRecord[]>();

  async metadataCheck(source: Source): Promise<SourceCheck> {
    const feed = await parseFeed(source);
    const normalized = normalizeFeed(feed);
    const fingerprint = hash(JSON.stringify(normalized));

    return {
      id: `check-${source.id}-${fingerprint.slice(0, 12)}`,
      sourceId: source.id,
      checkedAt: feed.generatedAt,
      status: "changed",
      fingerprint: `grants-gov:${source.id}:${fingerprint}`,
      summary: `Grants.gov metadata check captured ${normalized.length} normalized record(s).`
    };
  }

  async fetch(source: Source): Promise<RawAsset[]> {
    const feed = await parseFeed(source);
    const normalized = normalizeFeed(feed);
    const checksum = hash(JSON.stringify(normalized));
    const rawId = `raw-${source.id}-${checksum.slice(0, 12)}`;
    this.cache.set(rawId, normalized);

    return [
      {
        id: rawId,
        sourceId: source.id,
        ingestionRunId: `ingest-${source.id}-${checksum.slice(0, 12)}`,
        capturedAt: feed.generatedAt,
        checksum,
        contentType: "json",
        uri: source.url,
        metadata: {
          provider: "grants.gov",
          itemCount: normalized.length,
          deterministicNormalization: true
        }
      }
    ];
  }

  async normalize(source: Source, rawAssets: RawAsset[]): Promise<NormalizedRecord[]> {
    const rawAssetId = rawAssets[0]?.id;
    const cached = rawAssetId ? this.cache.get(rawAssetId) : undefined;
    const normalized = cached ?? normalizeFeed(await parseFeed(source));

    return normalized.map((record) => ({
      ...record,
      payload: {
        ...record.payload,
        sourceId: source.id,
        rawAssetId
      }
    }));
  }

  canProcessDiff(_source: Source): boolean {
    return true;
  }

  getDiffFingerprint(rawAsset: RawAsset): string {
    return `${rawAsset.sourceId}:${rawAsset.checksum}`;
  }
}
