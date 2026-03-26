import type { RawAsset, Source } from "@umbrella/core";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import { getAdapter } from "../lib/adapter-registry.js";

export async function runNormalization(source: Source, rawAssets: RawAsset[]): Promise<NormalizedRecord[]> {
  const adapter = getAdapter(source.adapterKey);
  return adapter.normalize(source, rawAssets);
}
