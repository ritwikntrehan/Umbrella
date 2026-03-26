import type { RawAsset, Source, SourceCheck } from "@umbrella/core";

export interface NormalizedRecord {
  externalId: string;
  title: string;
  summary?: string;
  publishedAt?: string;
  payload: Record<string, unknown>;
}

export interface SourceAdapter {
  readonly key: string;
  metadataCheck(source: Source): Promise<SourceCheck>;
  fetch(source: Source): Promise<RawAsset[]>;
  normalize(source: Source, rawAssets: RawAsset[]): Promise<NormalizedRecord[]>;
  canProcessDiff(source: Source): boolean;
  getDiffFingerprint(rawAsset: RawAsset): string;
}
