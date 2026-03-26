import type { ChannelConfig, Source } from "@umbrella/core";

export const marketSignalsSources: Source[] = [
  // TODO: Add production market signal sources in Phase 2.
];

export const marketSignalsChannelConfig: ChannelConfig = {
  slug: "market-signals",
  displayName: "Market Signals",
  description: "Market signals channel scaffold placeholder.",
  owner: "platform-editorial",
  enabled: false,
  sourceIds: marketSignalsSources.map((source) => source.id),
  defaultCadence: "weekly"
};
