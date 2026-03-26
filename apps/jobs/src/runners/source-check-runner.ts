import type { Source, SourceCheck } from "@umbrella/core";
import { getAdapter } from "../lib/adapter-registry.js";

export async function runSourceCheck(source: Source): Promise<SourceCheck> {
  const adapter = getAdapter(source.adapterKey);
  return adapter.metadataCheck(source);
}
