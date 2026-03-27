import type { ChannelConfig, Source } from "@umbrella/core";

export const manufacturingSources: Source[] = [
  {
    id: "manufacturing-pilot-network",
    channel: "manufacturing",
    name: "Manufacturing Network Activity Feed (Mock)",
    adapterKey: "mock-manufacturing-feed",
    url: "https://example.org/manufacturing/network",
    cadence: "daily",
    enabled: true,
    tags: ["manufacturing", "suppliers", "pilot", "deterministic"],
    notes: "Phase 1 manufacturing mock source for fourth-channel deterministic validation."
  }
];

export const manufacturingChannelConfig: ChannelConfig = {
  slug: "manufacturing",
  displayName: "Manufacturing",
  description: "Pilot channel for supplier capabilities, facility developments, and operational ecosystem shifts.",
  owner: "platform-editorial",
  enabled: true,
  sourceIds: manufacturingSources.map((source) => source.id),
  defaultCadence: "daily"
};
