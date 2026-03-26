import type { ChannelConfig, Source } from "@umbrella/core";

export const mAndASources: Source[] = [
  // TODO: Add production M&A sources in Phase 2.
];

export const mAndAChannelConfig: ChannelConfig = {
  slug: "m-and-a",
  displayName: "M&A",
  description: "Mergers and acquisitions channel scaffold placeholder.",
  owner: "platform-editorial",
  enabled: false,
  sourceIds: mAndASources.map((source) => source.id),
  defaultCadence: "weekly"
};
