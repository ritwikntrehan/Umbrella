import assert from "node:assert/strict";
import test from "node:test";
import { mAndASources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { MAndAChangeEvent } from "../runners/change-detection-runner.js";
import { assembleMAndABulletinArtifact } from "../runners/m-and-a-bulletin-assembler.js";

const source = mAndASources[0];
if (!source) {
  throw new Error("Missing M&A source fixture.");
}

function makeEvent(overrides: Partial<MAndAChangeEvent>): MAndAChangeEvent {
  return {
    id: "change-m-and-a-pilot-briefings-001",
    sourceId: source.id,
    detectedAt: "2026-03-27T12:00:00.000Z",
    status: "initial",
    currentFingerprint: "abc123",
    previousFingerprint: undefined,
    addedExternalIds: ["MA-ASSET-310"],
    updatedExternalIds: [],
    removedExternalIds: [],
    currentExternalIds: ["MA-ASSET-310"],
    ...overrides
  };
}

test("assembles M&A bulletin artifact for changed run", () => {
  const changedRecords: NormalizedRecord[] = [
    {
      externalId: "MA-ASSET-310",
      title: "Regional cold-chain operator divests non-core last-mile unit",
      summary: "Pilot M&A signal",
      publishedAt: "2026-03-25T00:00:00.000Z",
      payload: { sourceId: source.id, signalType: "asset-move" }
    },
    {
      externalId: "MA-OPS-455",
      title: "Industrial components platform posts two-quarter on-time delivery recovery",
      publishedAt: "2026-03-27T00:00:00.000Z",
      payload: { sourceId: source.id, signalType: "operating-signal" }
    }
  ];

  const artifact = assembleMAndABulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["MA-OPS-455"], currentExternalIds: ["MA-ASSET-310", "MA-OPS-455"] }),
    normalizedRecords: changedRecords
  });

  assert.equal(artifact.channel_id, "m-and-a");
  assert.equal(artifact.what_changed.items.some((item) => item.includes("MA-OPS-455")), true);
  assert.equal(artifact.watchlist_1_4_weeks?.items[0], "MA-OPS-455: Industrial components platform posts two-quarter on-time delivery recovery");
});
