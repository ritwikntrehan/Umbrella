import assert from "node:assert/strict";
import test from "node:test";
import { tradeSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { TradeChangeEvent } from "../runners/change-detection-runner.js";
import { TRADE_EDITORIAL_INSTRUCTIONS_V1 } from "../runners/trade-editorial-instructions.js";
import { assembleTradeBulletinArtifact } from "../runners/trade-bulletin-assembler.js";
import { transformTradeBulletinToEditorial } from "../runners/trade-editorial-transformer.js";

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

test("transforms trade bulletin artifact into trade editorial artifact", () => {
  const bulletin = assembleTradeBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "initial" }),
    normalizedRecords: baseRecords
  });

  const editorial = transformTradeBulletinToEditorial({ bulletin });

  assert.equal(editorial.channel_id, "trade");
  assert.equal(editorial.bulletin_id, bulletin.bulletin_id);
  assert.equal(editorial.editorial_instruction_version, TRADE_EDITORIAL_INSTRUCTIONS_V1.instruction_version);
  assert.equal(editorial.refined_data_snapshot?.total_records, 1);
});
