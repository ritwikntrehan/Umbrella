import type { SourceAdapter } from "@umbrella/source-adapters";
import { MockGrantsAdapter } from "@umbrella/source-adapters";

const registry: Record<string, SourceAdapter> = {
  "mock-grants-feed": new MockGrantsAdapter()
};

export function getAdapter(adapterKey: string): SourceAdapter {
  const adapter = registry[adapterKey];
  if (!adapter) {
    throw new Error(`No adapter registered for key: ${adapterKey}`);
  }
  return adapter;
}
