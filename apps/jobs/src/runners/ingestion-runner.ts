import type { IngestionRun, RawAsset, Source } from "@umbrella/core";
import { getAdapter } from "../lib/adapter-registry.js";

export async function runIngestion(source: Source): Promise<{ run: IngestionRun; rawAssets: RawAsset[] }> {
  const adapter = getAdapter(source.adapterKey);
  const startedAt = new Date().toISOString();
  const rawAssets = await adapter.fetch(source);

  return {
    run: {
      id: `run-${source.id}-${Date.now()}`,
      sourceId: source.id,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "success",
      rawAssetCount: rawAssets.length
    },
    rawAssets
  };
}
