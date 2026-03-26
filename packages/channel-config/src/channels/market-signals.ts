import type { ChannelConfig, Source } from "@umbrella/core";

export const marketSignalsSources: Source[] = [
  {
    id: "market-signals-pilot-feed",
    channel: "market-signals",
    name: "Market Signals Pilot Feed (Mock)",
    adapterKey: "mock-market-signals-feed",
    url: "https://example.org/market-signals/pilot",
    cadence: "daily",
    enabled: true,
    tags: ["market-signals", "pilot", "deterministic"],
    notes: "Phase 1 market-signals mock source for third-channel deterministic validation."
  }
];

export const marketSignalsChannelConfig: ChannelConfig = {
  slug: "market-signals",
  displayName: "Market Signals",
  description: "Pilot channel for market shifts that may affect supply, pricing, and operations.",
  owner: "platform-editorial",
  enabled: true,
  sourceIds: marketSignalsSources.map((source) => source.id),
  defaultCadence: "daily"
};
