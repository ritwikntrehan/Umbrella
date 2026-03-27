import assert from "node:assert/strict";
import test from "node:test";
import { manufacturingSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { ManufacturingChangeEvent } from "../runners/change-detection-runner.js";
import { assembleManufacturingBulletinArtifact } from "../runners/manufacturing-bulletin-assembler.js";

const source = manufacturingSources[0];
if (!source) {
  throw new Error("Missing manufacturing source fixture.");
}

function makeEvent(overrides: Partial<ManufacturingChangeEvent>): ManufacturingChangeEvent {
  return {
    id: "change-manufacturing-pilot-network-001",
    sourceId: source.id,
    detectedAt: "2026-03-26T12:00:00.000Z",
    status: "initial",
    currentFingerprint: "abc123",
    previousFingerprint: undefined,
    addedExternalIds: ["MFG-CAP-100"],
    updatedExternalIds: [],
    removedExternalIds: [],
    currentExternalIds: ["MFG-CAP-100"],
    ...overrides
  };
}

test("assembles manufacturing bulletin artifact for changed run", () => {
  const changedRecords: NormalizedRecord[] = [
    {
      externalId: "MFG-CAP-100",
      title: "Tier-2 precision casting line qualified for aerospace housings",
      summary: "Pilot manufacturing signal",
      publishedAt: "2026-03-24T00:00:00.000Z",
      payload: { sourceId: source.id, signalClass: "capability-change" }
    },
    {
      externalId: "MFG-OPS-240",
      title: "Stamping network adds weekend shift coverage",
      publishedAt: "2026-03-26T00:00:00.000Z",
      payload: { sourceId: source.id, signalClass: "operational-shift" }
    }
  ];

  const artifact = assembleManufacturingBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["MFG-OPS-240"], currentExternalIds: ["MFG-CAP-100", "MFG-OPS-240"] }),
    normalizedRecords: changedRecords
  });

  assert.equal(artifact.channel_id, "manufacturing");
  assert.equal(artifact.what_changed.items.some((item) => item.includes("MFG-OPS-240")), true);
  assert.equal(artifact.watchlist_1_4_weeks?.items[0], "MFG-OPS-240: Stamping network adds weekend shift coverage");
});
