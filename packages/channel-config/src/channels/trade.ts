import type { ChannelConfig, Source } from "@umbrella/core";

export const tradeSources: Source[] = [
  // TODO: Add production trade sources in Phase 2.
];

export const tradeChannelConfig: ChannelConfig = {
  slug: "trade",
  displayName: "Trade",
  description: "Trade channel scaffold placeholder.",
  owner: "platform-editorial",
  enabled: false,
  sourceIds: tradeSources.map((source) => source.id),
  defaultCadence: "weekly"
};
