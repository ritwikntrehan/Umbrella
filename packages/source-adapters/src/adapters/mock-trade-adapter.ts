import { createHash } from "node:crypto";
import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord, SourceAdapter } from "../types.js";

interface MockTradeItem {
  updateId: string;
  title: string;
  summary: string;
  jurisdiction: string;
  policyType: "tariff" | "export-control" | "customs";
  effectiveDate: string;
  impactedSectors: string[];
}

interface MockTradeFeed {
  version: string;
  generatedAt: string;
  items: MockTradeItem[];
}

const FEEDS: Record<string, MockTradeFeed> = {
  base: {
    version: "v1",
    generatedAt: "2026-03-25T00:00:00.000Z",
    items: [
      {
        updateId: "USTR-100",
        title: "Section 301 Machinery Review Window",
        summary: "Request period opened for targeted machinery tariff exclusions.",
        jurisdiction: "United States",
        policyType: "tariff",
        effectiveDate: "2026-03-24",
        impactedSectors: ["industrial machinery", "components"]
      }
    ]
  },
  changed: {
    version: "v2",
    generatedAt: "2026-03-26T00:00:00.000Z",
    items: [
      {
        updateId: "USTR-100",
        title: "Section 301 Machinery Review Window",
        summary: "Request period extended for targeted machinery tariff exclusions.",
        jurisdiction: "United States",
        policyType: "tariff",
        effectiveDate: "2026-03-26",
        impactedSectors: ["industrial machinery", "components", "subassemblies"]
      },
      {
        updateId: "CBP-220",
        title: "Advance Customs Data Filing Pilot",
        summary: "New pilot standards for pre-arrival customs data filing.",
        jurisdiction: "United States",
        policyType: "customs",
        effectiveDate: "2026-03-27",
        impactedSectors: ["importers", "logistics"]
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

function buildFeedAsset(source: Source): { rawAsset: RawAsset; feed: MockTradeFeed; feedFingerprint: string } {
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

export class MockTradeAdapter implements SourceAdapter {
  readonly key = "mock-trade-feed";

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
      externalId: item.updateId,
      title: item.title,
      summary: item.summary,
      publishedAt: item.effectiveDate,
      payload: {
        sourceId: source.id,
        rawAssetId,
        jurisdiction: item.jurisdiction,
        policyType: item.policyType,
        impactedSectors: item.impactedSectors
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
