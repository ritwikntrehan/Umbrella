import type { ChannelConfig, Source } from "@umbrella/core";

export const tradeSources: Source[] = [
  {
    id: "trade-pilot-bulletins",
    channel: "trade",
    name: "Trade Policy Bulletins (Mock)",
    adapterKey: "mock-trade-feed",
    url: "https://example.org/trade/bulletins",
    cadence: "daily",
    enabled: true,
    tags: ["trade", "policy", "pilot"],
    notes: "Phase 1 trade mock source for deterministic second-channel validation."
  }
];

export const tradeChannelConfig: ChannelConfig = {
  slug: "trade",
  displayName: "Trade",
  description: "Pilot channel for trade policy and tariff-related updates.",
  owner: "platform-editorial",
  enabled: true,
  sourceIds: tradeSources.map((source) => source.id),
  defaultCadence: "daily"
};
