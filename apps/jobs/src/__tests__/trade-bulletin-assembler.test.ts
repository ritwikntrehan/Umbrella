import assert from "node:assert/strict";
import test from "node:test";
import { tradeSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { TradeChangeEvent } from "../runners/change-detection-runner.js";
import { assembleTradeBulletinArtifact } from "../runners/trade-bulletin-assembler.js";

const source = tradeSources[0];
if (!source) {
  throw new Error("Missing trade source fixture.");
}

const baseRecords: NormalizedRecord[] = [
  {
    externalId: "USTR-100",
    title: "Section 301 Machinery Review Window",
    summary: "Pilot trade notice",
    publishedAt: "2026-03-24T00:00:00.000Z",
    payload: { sourceId: source.id, policyType: "tariff" }
  }
];

function makeEvent(overrides: Partial<TradeChangeEvent>): TradeChangeEvent {
  return {
    id: "change-trade-pilot-bulletins-001",
    sourceId: source.id,
    detectedAt: "2026-03-26T12:00:00.000Z",
    status: "initial",
    currentFingerprint: "abc123",
    previousFingerprint: undefined,
    addedExternalIds: ["USTR-100"],
    updatedExternalIds: [],
    removedExternalIds: [],
    currentExternalIds: ["USTR-100"],
    ...overrides
  };
}

test("assembles trade bulletin artifact for changed run", () => {
  const changedRecords: NormalizedRecord[] = [
    ...baseRecords,
    {
      externalId: "CBP-220",
      title: "Advance Customs Data Filing Pilot",
      publishedAt: "2026-03-27T00:00:00.000Z",
      payload: { sourceId: source.id, policyType: "customs" }
    }
  ];

  const artifact = assembleTradeBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["CBP-220"], currentExternalIds: ["USTR-100", "CBP-220"] }),
    normalizedRecords: changedRecords
  });

  assert.equal(artifact.channel_id, "trade");
  assert.equal(artifact.what_changed.items.some((item) => item.includes("CBP-220")), true);
  assert.equal(artifact.watchlist_1_4_weeks?.items[0], "CBP-220: Advance Customs Data Filing Pilot");
});
