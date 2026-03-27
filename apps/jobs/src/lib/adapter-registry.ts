import type { SourceAdapter } from "@umbrella/source-adapters";
import {
  GrantsGovAdapter,
  MockGrantsAdapter,
  MockManufacturingAdapter,
  MockMarketSignalsAdapter,
  MockMAndAAdapter,
  MockTradeAdapter
} from "@umbrella/source-adapters";

const registry: Record<string, SourceAdapter> = {
  "grants-gov-feed": new GrantsGovAdapter(),
  "mock-grants-feed": new MockGrantsAdapter(),
  "mock-trade-feed": new MockTradeAdapter(),
  "mock-market-signals-feed": new MockMarketSignalsAdapter(),
  "mock-manufacturing-feed": new MockManufacturingAdapter(),
  "mock-m-and-a-feed": new MockMAndAAdapter()
};

export function getAdapter(adapterKey: string): SourceAdapter {
  const adapter = registry[adapterKey];
  if (!adapter) {
    throw new Error(`No adapter registered for key: ${adapterKey}`);
  }
  return adapter;
}
