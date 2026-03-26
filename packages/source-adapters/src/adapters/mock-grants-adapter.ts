import { createHash } from "node:crypto";
import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord, SourceAdapter } from "../types.js";

interface MockGrantItem {
  grantId: string;
  title: string;
  summary: string;
  agency: string;
  amountUsd: number;
  postedDate: string;
  dueDate: string;
}

interface MockGrantFeed {
  version: string;
  generatedAt: string;
  items: MockGrantItem[];
}

const FEEDS: Record<string, MockGrantFeed> = {
  base: {
    version: "v1",
    generatedAt: "2026-03-25T00:00:00.000Z",
    items: [
      {
        grantId: "DOE-001",
        title: "Battery Supply Chain Pilot",
        summary: "Pilot funding opportunity for domestic battery component suppliers.",
        agency: "Department of Energy",
        amountUsd: 2000000,
        postedDate: "2026-03-24",
        dueDate: "2026-05-01"
      }
    ]
  },
  changed: {
    version: "v2",
    generatedAt: "2026-03-26T00:00:00.000Z",
    items: [
      {
        grantId: "DOE-001",
        title: "Battery Supply Chain Pilot",
        summary: "Pilot funding opportunity for domestic battery component suppliers.",
        agency: "Department of Energy",
        amountUsd: 2500000,
        postedDate: "2026-03-24",
        dueDate: "2026-05-15"
      },
      {
        grantId: "USDA-010",
        title: "Rural Processing Modernization",
        summary: "Capital grants for modernization of rural food processing sites.",
        agency: "USDA",
        amountUsd: 800000,
        postedDate: "2026-03-26",
        dueDate: "2026-06-30"
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

function buildFeedAsset(source: Source): { rawAsset: RawAsset; feed: MockGrantFeed; feedFingerprint: string } {
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

export class MockGrantsAdapter implements SourceAdapter {
  readonly key = "mock-grants-feed";

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
      externalId: item.grantId,
      title: item.title,
      summary: item.summary,
      publishedAt: item.postedDate,
      payload: {
        sourceId: source.id,
        rawAssetId,
        agency: item.agency,
        amountUsd: item.amountUsd,
        dueDate: item.dueDate
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
