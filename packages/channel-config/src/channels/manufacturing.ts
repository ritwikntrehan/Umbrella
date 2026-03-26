import type { ChannelConfig, Source } from "@umbrella/core";

export const manufacturingSources: Source[] = [
  // TODO: Add production manufacturing sources in Phase 2.
];

export const manufacturingChannelConfig: ChannelConfig = {
  slug: "manufacturing",
  displayName: "Manufacturing",
  description: "Manufacturing channel scaffold placeholder.",
  owner: "platform-editorial",
  enabled: false,
  sourceIds: manufacturingSources.map((source) => source.id),
  defaultCadence: "weekly"
};
