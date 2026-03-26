import type { ChannelConfig, Source } from "@umbrella/core";

export const grantsSources: Source[] = [
  {
    id: "grants-fed-notices",
    channel: "grants",
    name: "Federal Grants Notices (Mock)",
    adapterKey: "mock-grants-feed",
    url: "https://example.org/grants/notices",
    cadence: "daily",
    enabled: true,
    tags: ["federal", "notices", "pilot"],
    notes: "Phase 1 mock source used for deterministic pipeline wiring."
  }
];

export const grantsChannelConfig: ChannelConfig = {
  slug: "grants",
  displayName: "Grants",
  description: "Pilot channel for grant-related opportunities and updates.",
  owner: "platform-editorial",
  enabled: true,
  sourceIds: grantsSources.map((source) => source.id),
  defaultCadence: "daily"
};
