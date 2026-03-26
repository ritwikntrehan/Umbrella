import { createHash } from "node:crypto";
import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord, SourceAdapter } from "../types.js";

interface MockMarketSignalItem {
  signalId: string;
  title: string;
  summary: string;
  signalType: "pricing" | "freight" | "inventory";
  region: string;
  severity: "low" | "medium" | "high";
  effectiveDate: string;
}

interface MockMarketSignalsFeed {
  version: string;
  generatedAt: string;
  items: MockMarketSignalItem[];
}

const FEEDS: Record<string, MockMarketSignalsFeed> = {
  base: {
    version: "v1",
    generatedAt: "2026-03-25T00:00:00.000Z",
    items: [
      {
        signalId: "MS-ENERGY-001",
        title: "Industrial power forward curve uptick",
        summary: "Forward pricing for industrial power contracts moved up in core Midwest hubs.",
        signalType: "pricing",
        region: "US Midwest",
        severity: "medium",
        effectiveDate: "2026-03-24"
      }
    ]
  },
  changed: {
    version: "v2",
    generatedAt: "2026-03-26T00:00:00.000Z",
    items: [
      {
        signalId: "MS-ENERGY-001",
        title: "Industrial power forward curve uptick",
        summary: "Forward pricing for industrial power contracts moved up further in core Midwest hubs.",
        signalType: "pricing",
        region: "US Midwest",
        severity: "high",
        effectiveDate: "2026-03-26"
      },
      {
        signalId: "MS-FREIGHT-014",
        title: "Gulf container dwell times easing",
        summary: "Average dwell times in Gulf container terminals eased versus prior week baseline.",
        signalType: "freight",
        region: "US Gulf",
        severity: "low",
        effectiveDate: "2026-03-26"
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

function buildFeedAsset(source: Source): { rawAsset: RawAsset; feed: MockMarketSignalsFeed; feedFingerprint: string } {
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

export class MockMarketSignalsAdapter implements SourceAdapter {
  readonly key = "mock-market-signals-feed";

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
        signalType: item.signalType,
        region: item.region,
        severity: item.severity
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
