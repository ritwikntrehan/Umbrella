import assert from "node:assert/strict";
import test from "node:test";
import { grantsSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { GrantsChangeEvent } from "../runners/change-detection-runner.js";
import { assembleGrantsBulletinArtifact } from "../runners/grants-bulletin-assembler.js";

const source = grantsSources[0];
if (!source) {
  throw new Error("Missing grants source fixture.");
}

const baseRecords: NormalizedRecord[] = [
  {
    externalId: "DOE-001",
    title: "Clean Energy Innovation Grant",
    summary: "Pilot grant opportunity",
    publishedAt: "2026-03-20T00:00:00.000Z",
    payload: { sourceId: source.id, amountUsd: 500000 }
  }
];

function makeEvent(overrides: Partial<GrantsChangeEvent>): GrantsChangeEvent {
  return {
    id: "change-grants-fed-notices-001",
    sourceId: source.id,
    detectedAt: "2026-03-26T12:00:00.000Z",
    status: "initial",
    currentFingerprint: "abc123",
    previousFingerprint: undefined,
    addedExternalIds: ["DOE-001"],
    updatedExternalIds: [],
    removedExternalIds: [],
    currentExternalIds: ["DOE-001"],
    ...overrides
  };
}

test("assembles bulletin artifact for initial run", () => {
  const artifact = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "initial" }),
    normalizedRecords: baseRecords
  });

  assert.equal(artifact.channel_id, "grants");
  assert.equal(artifact.bulletin_period.start_date, "2026-03-20");
  assert.equal(artifact.what_changed.items[0], "Initial deterministic grants baseline captured for this source.");
  assert.equal(artifact.data_snapshot?.total_records, 1);
  assert.ok(artifact.provenance_references.length >= 2);
});

test("assembles bulletin artifact for no-change run", () => {
  const artifact = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "no_change", addedExternalIds: [] }),
    normalizedRecords: baseRecords
  });

  assert.equal(artifact.top_line.body.includes("No-change"), true);
  assert.equal(artifact.what_changed.items.length, 1);
  assert.equal(artifact.watchlist_1_4_weeks?.items.length, 0);
  assert.equal(artifact.watchlist_1_4_weeks?.empty_state_reason, "No new or updated opportunities detected in this run.");
});

test("assembles bulletin artifact for changed run", () => {
  const changedRecords: NormalizedRecord[] = [
    ...baseRecords,
    {
      externalId: "USDA-010",
      title: "Rural Manufacturing Support Grant",
      publishedAt: "2026-03-25T00:00:00.000Z",
      payload: { sourceId: source.id, amountUsd: 250000 }
    }
  ];

  const artifact = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["USDA-010"], currentExternalIds: ["DOE-001", "USDA-010"] }),
    normalizedRecords: changedRecords
  });

  assert.equal(artifact.what_changed.items.some((item) => item.includes("Added opportunities: USDA-010")), true);
  assert.equal(artifact.watchlist_1_4_weeks?.items[0], "USDA-010: Rural Manufacturing Support Grant");
  assert.equal(artifact.record_references.length, 2);
});

test("optional sections use empty states when no normalized records are available", () => {
  const artifact = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "initial", currentExternalIds: [], addedExternalIds: [] }),
    normalizedRecords: []
  });

  assert.equal(artifact.data_snapshot, null);
  assert.equal(artifact.watchlist_1_4_weeks?.items.length, 0);
  assert.equal(artifact.record_references.length, 0);
});

test("assembly output is stable for identical input", () => {
  const input = {
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["DOE-001"] }),
    normalizedRecords: baseRecords
  };

  const first = assembleGrantsBulletinArtifact(input);
  const second = assembleGrantsBulletinArtifact(input);

  assert.deepEqual(first, second);
});
