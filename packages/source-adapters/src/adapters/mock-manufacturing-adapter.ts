import { createHash } from "node:crypto";
import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord, SourceAdapter } from "../types.js";

interface MockManufacturingItem {
  signalId: string;
  title: string;
  summary: string;
  signalClass: "capability-change" | "facility-development" | "ecosystem-movement" | "operational-shift";
  supplier: string;
  location: string;
  effectiveDate: string;
  impactLevel: "watch" | "priority";
}

interface MockManufacturingFeed {
  version: string;
  generatedAt: string;
  items: MockManufacturingItem[];
}

const FEEDS: Record<string, MockManufacturingFeed> = {
  base: {
    version: "v1",
    generatedAt: "2026-03-25T00:00:00.000Z",
    items: [
      {
        signalId: "MFG-CAP-100",
        title: "Tier-2 precision casting line qualified for aerospace housings",
        summary: "Supplier qualification completed for high-tolerance aluminum casting capacity.",
        signalClass: "capability-change",
        supplier: "MidRiver Cast & Forge",
        location: "Ohio, US",
        effectiveDate: "2026-03-24",
        impactLevel: "priority"
      }
    ]
  },
  changed: {
    version: "v2",
    generatedAt: "2026-03-26T00:00:00.000Z",
    items: [
      {
        signalId: "MFG-CAP-100",
        title: "Tier-2 precision casting line qualified for aerospace housings",
        summary: "Supplier qualification expanded to include larger envelope castings for enclosure assemblies.",
        signalClass: "capability-change",
        supplier: "MidRiver Cast & Forge",
        location: "Ohio, US",
        effectiveDate: "2026-03-26",
        impactLevel: "priority"
      },
      {
        signalId: "MFG-OPS-240",
        title: "Stamping network adds weekend shift coverage",
        summary: "Regional supplier cluster introduced weekend throughput window for backlog recovery.",
        signalClass: "operational-shift",
        supplier: "Lakefront Stamping Group",
        location: "Michigan, US",
        effectiveDate: "2026-03-26",
        impactLevel: "watch"
      }
    ]
  }
};

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resolveVariant(url: string): keyof typeof FEEDS {
  const variant = new URL(url).searchParams.get("variant");
  return variant === "changed" ? "changed" : "base";
}

function buildFeedAsset(source: Source): { rawAsset: RawAsset; feed: MockManufacturingFeed; feedFingerprint: string } {
  const variant = resolveVariant(source.url);
  const feed = FEEDS[variant];
  const serializedFeed = JSON.stringify(feed);
  const feedFingerprint = hash(serializedFeed);
  const assetId = `raw-${source.id}-${feed.version}`;

  return {
    rawAsset: {
      id: assetId,
      sourceId: source.id,
      ingestionRunId: `ingest-${source.id}-${feed.version}`,
      capturedAt: feed.generatedAt,
      checksum: feedFingerprint,
      contentType: "json",
      uri: `${source.url}#${feed.version}`,
      metadata: {
        mock: true,
        itemCount: feed.items.length,
        feedVersion: feed.version
      }
    },
    feed,
    feedFingerprint
  };
}

export class MockManufacturingAdapter implements SourceAdapter {
  readonly key = "mock-manufacturing-feed";

  async metadataCheck(source: Source): Promise<SourceCheck> {
    const { feedFingerprint, feed } = buildFeedAsset(source);

    return {
      id: `check-${source.id}-${feed.version}`,
      sourceId: source.id,
      checkedAt: feed.generatedAt,
      status: "changed",
      fingerprint: `mock:${source.id}:${feedFingerprint}`,
      summary: `Mock metadata check using ${feed.version} fixture.`
    };
  }

  async fetch(source: Source): Promise<RawAsset[]> {
    const { rawAsset } = buildFeedAsset(source);
    return [rawAsset];
  }

  async normalize(source: Source, rawAssets: RawAsset[]): Promise<NormalizedRecord[]> {
    const { feed } = buildFeedAsset(source);
    const rawAssetId = rawAssets[0]?.id;

    return feed.items.map((item) => ({
      externalId: item.signalId,
      title: item.title,
      summary: item.summary,
      publishedAt: item.effectiveDate,
      payload: {
        sourceId: source.id,
        rawAssetId,
        signalClass: item.signalClass,
        supplier: item.supplier,
        location: item.location,
        impactLevel: item.impactLevel
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
