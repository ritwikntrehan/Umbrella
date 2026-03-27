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
  },
  {
    id: "grants-gov-opportunities",
    channel: "grants",
    name: "Grants.gov Opportunities API",
    adapterKey: "grants-gov-feed",
    url: "https://api.grants.gov/v1/api/search2?fixture=base",
    cadence: "daily",
    enabled: true,
    tags: ["federal", "opportunities", "production-adapter"],
    notes: "Production-grade grants adapter using Grants.gov payload normalization; fixture query param supports deterministic CI."
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
