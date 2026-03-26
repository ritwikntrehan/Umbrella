import { createHash } from "node:crypto";
import type { IngestionRun, RawAsset, Source } from "@umbrella/core";
import { getAdapter } from "../lib/adapter-registry.js";

function hashRawAssets(rawAssets: RawAsset[]): string {
  const normalized = rawAssets.map((asset) => `${asset.id}:${asset.checksum}`).sort().join("|");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 10);
}

export async function runIngestion(source: Source): Promise<{ run: IngestionRun; rawAssets: RawAsset[] }> {
  const adapter = getAdapter(source.adapterKey);
  const startedAt = new Date().toISOString();
  const rawAssets = await adapter.fetch(source);
  const runFingerprint = hashRawAssets(rawAssets);
  const runId = `run-${source.id}-${runFingerprint}`;

  return {
    run: {
      id: runId,
      sourceId: source.id,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "success",
      rawAssetCount: rawAssets.length
    },
    rawAssets: rawAssets.map((asset) => ({ ...asset, ingestionRunId: runId }))
  };
}
