import { createHash } from "node:crypto";
import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord, SourceAdapter } from "../types.js";

interface MockMAndAItem {
  signalId: string;
  title: string;
  summary: string;
  company: string;
  signalType: "asset-move" | "operating-signal" | "market-position";
  relevance: "high" | "medium";
  publishedDate: string;
  assessmentAngle: string;
}

interface MockMAndAFeed {
  version: string;
  generatedAt: string;
  items: MockMAndAItem[];
}

const FEEDS: Record<string, MockMAndAFeed> = {
  base: {
    version: "v1",
    generatedAt: "2026-03-26T00:00:00.000Z",
    items: [
      {
        signalId: "MA-ASSET-310",
        title: "Regional cold-chain operator divests non-core last-mile unit",
        summary: "Divestiture may sharpen core margin profile and simplify carve-out diligence scope.",
        company: "Northline Logistics",
        signalType: "asset-move",
        relevance: "high",
        publishedDate: "2026-03-25",
        assessmentAngle: "Carve-out readiness and stranded-cost exposure"
      }
    ]
  },
  changed: {
    version: "v2",
    generatedAt: "2026-03-27T00:00:00.000Z",
    items: [
      {
        signalId: "MA-ASSET-310",
        title: "Regional cold-chain operator divests non-core last-mile unit",
        summary: "Divestiture may sharpen core margin profile and simplify carve-out diligence scope.",
        company: "Northline Logistics",
        signalType: "asset-move",
        relevance: "high",
        publishedDate: "2026-03-25",
        assessmentAngle: "Carve-out readiness and stranded-cost exposure"
      },
      {
        signalId: "MA-OPS-455",
        title: "Industrial components platform posts two-quarter on-time delivery recovery",
        summary: "Sustained service-level recovery can materially improve quality-of-earnings confidence.",
        company: "Arden Components Group",
        signalType: "operating-signal",
        relevance: "high",
        publishedDate: "2026-03-27",
        assessmentAngle: "Operational turnaround durability and value-creation upside"
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

function buildFeedAsset(source: Source): { rawAsset: RawAsset; feed: MockMAndAFeed; feedFingerprint: string } {
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

export class MockMAndAAdapter implements SourceAdapter {
  readonly key = "mock-m-and-a-feed";

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
      publishedAt: item.publishedDate,
      payload: {
        sourceId: source.id,
        rawAssetId,
        company: item.company,
        signalType: item.signalType,
        relevance: item.relevance,
        assessmentAngle: item.assessmentAngle
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
