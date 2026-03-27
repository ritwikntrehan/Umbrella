import type { ChannelConfig, Source } from "@umbrella/core";

export const mAndASources: Source[] = [
  {
    id: "m-and-a-pilot-briefings",
    channel: "m-and-a",
    name: "M&A Business Assessment Briefings (Mock)",
    adapterKey: "mock-m-and-a-feed",
    url: "https://example.org/m-and-a/briefings",
    cadence: "daily",
    enabled: true,
    tags: ["m-and-a", "business-assessment", "pilot", "deterministic"],
    notes: "Phase 1 M&A mock source for fifth-channel deterministic validation."
  }
];

export const mAndAChannelConfig: ChannelConfig = {
  slug: "m-and-a",
  displayName: "M&A",
  description:
    "Pilot channel for acquisition-oriented intelligence on businesses, assets, operating signals, and value-creation opportunities.",
  owner: "platform-editorial",
  enabled: true,
  sourceIds: mAndASources.map((source) => source.id),
  defaultCadence: "daily"
};
