import assert from "node:assert/strict";
import test from "node:test";
import { marketSignalsSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { MarketSignalsChangeEvent } from "../runners/change-detection-runner.js";
import { MARKET_SIGNALS_EDITORIAL_INSTRUCTIONS_V1 } from "../runners/market-signals-editorial-instructions.js";
import { assembleMarketSignalsBulletinArtifact } from "../runners/market-signals-bulletin-assembler.js";
import { transformMarketSignalsBulletinToEditorial } from "../runners/market-signals-editorial-transformer.js";

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

test("transforms market-signals bulletin artifact into market-signals editorial artifact", () => {
  const bulletin = assembleMarketSignalsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "initial" }),
    normalizedRecords: baseRecords
  });

  const editorial = transformMarketSignalsBulletinToEditorial({ bulletin });

  assert.equal(editorial.channel_id, "market-signals");
  assert.equal(editorial.bulletin_id, bulletin.bulletin_id);
  assert.equal(editorial.editorial_instruction_version, MARKET_SIGNALS_EDITORIAL_INSTRUCTIONS_V1.instruction_version);
  assert.equal(editorial.refined_data_snapshot?.total_records, 1);
});
