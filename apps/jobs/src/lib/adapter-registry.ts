import type { SourceAdapter } from "@umbrella/source-adapters";
import { MockGrantsAdapter, MockMarketSignalsAdapter, MockTradeAdapter } from "@umbrella/source-adapters";

const registry: Record<string, SourceAdapter> = {
  "mock-grants-feed": new MockGrantsAdapter(),
  "mock-trade-feed": new MockTradeAdapter(),
  "mock-market-signals-feed": new MockMarketSignalsAdapter()
};

export function getAdapter(adapterKey: string): SourceAdapter {
  const adapter = registry[adapterKey];
  if (!adapter) {
    throw new Error(`No adapter registered for key: ${adapterKey}`);
  }
  return adapter;
}
