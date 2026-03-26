import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord, SourceAdapter } from "../types.js";

export class MockGrantsAdapter implements SourceAdapter {
  readonly key = "mock-grants-feed";

  async metadataCheck(source: Source): Promise<SourceCheck> {
    return {
      id: `check-${source.id}-${Date.now()}`,
      sourceId: source.id,
      checkedAt: new Date().toISOString(),
      status: "changed",
      fingerprint: `mock:${source.id}:v1`,
      summary: "Mock metadata check indicates fresh content for pilot flow."
    };
  }

  async fetch(source: Source): Promise<RawAsset[]> {
    const timestamp = new Date().toISOString();

    return [
      {
        id: `raw-${source.id}-${Date.now()}`,
        sourceId: source.id,
        ingestionRunId: `ingest-${source.id}-${Date.now()}`,
        capturedAt: timestamp,
        checksum: "mock-checksum-001",
        contentType: "json",
        uri: `${source.url}?mock=true`,
        metadata: {
          mock: true,
          itemCount: 1
        }
      }
    ];
  }

  async normalize(_source: Source, rawAssets: RawAsset[]): Promise<NormalizedRecord[]> {
    return rawAssets.map((asset) => ({
      externalId: asset.id,
      title: "Mock Grants Opportunity",
      summary: "Placeholder normalized record for pipeline scaffolding.",
      publishedAt: asset.capturedAt,
      payload: {
        rawAssetId: asset.id,
        uri: asset.uri
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
