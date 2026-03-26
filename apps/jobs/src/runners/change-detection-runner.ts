import type { RawAsset, Source } from "@umbrella/core";
import { getAdapter } from "../lib/adapter-registry.js";

export function runChangeDetection(source: Source, rawAssets: RawAsset[]): string[] {
  const adapter = getAdapter(source.adapterKey);

  if (!adapter.canProcessDiff(source)) {
    return [];
  }

  return rawAssets.map((asset) => adapter.getDiffFingerprint(asset));
}
