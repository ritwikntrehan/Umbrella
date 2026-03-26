import assert from "node:assert/strict";
import test from "node:test";
import { marketSignalsSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { MarketSignalsChangeEvent } from "../runners/change-detection-runner.js";
import { assembleMarketSignalsBulletinArtifact } from "../runners/market-signals-bulletin-assembler.js";

const source = marketSignalsSources[0];
if (!source) {
  throw new Error("Missing market-signals source fixture.");
}

const baseRecords: NormalizedRecord[] = [
  {
    externalId: "MS-ENERGY-001",
    title: "Industrial power forward curve uptick",
    summary: "Pilot market signal",
    publishedAt: "2026-03-24T00:00:00.000Z",
    payload: { sourceId: source.id, signalType: "pricing" }
  }
];

function makeEvent(overrides: Partial<MarketSignalsChangeEvent>): MarketSignalsChangeEvent {
  return {
    id: "change-market-signals-pilot-feed-001",
    sourceId: source.id,
    detectedAt: "2026-03-26T12:00:00.000Z",
    status: "initial",
    currentFingerprint: "abc123",
    previousFingerprint: undefined,
    addedExternalIds: ["MS-ENERGY-001"],
    updatedExternalIds: [],
    removedExternalIds: [],
    currentExternalIds: ["MS-ENERGY-001"],
    ...overrides
  };
}

test("assembles market-signals bulletin artifact for changed run", () => {
  const changedRecords: NormalizedRecord[] = [
    ...baseRecords,
    {
      externalId: "MS-FREIGHT-014",
      title: "Gulf container dwell times easing",
      publishedAt: "2026-03-26T00:00:00.000Z",
      payload: { sourceId: source.id, signalType: "freight" }
    }
  ];

  const artifact = assembleMarketSignalsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["MS-FREIGHT-014"], currentExternalIds: ["MS-ENERGY-001", "MS-FREIGHT-014"] }),
    normalizedRecords: changedRecords
  });

  assert.equal(artifact.channel_id, "market-signals");
  assert.equal(artifact.what_changed.items.some((item) => item.includes("MS-FREIGHT-014")), true);
  assert.equal(artifact.watchlist_1_4_weeks?.items[0], "MS-FREIGHT-014: Gulf container dwell times easing");
});
