import assert from "node:assert/strict";
import test from "node:test";
import { grantsSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { GrantsChangeEvent } from "../runners/change-detection-runner.js";
import { assembleGrantsBulletinArtifact } from "../runners/grants-bulletin-assembler.js";
import {
  GRANTS_EDITORIAL_INSTRUCTIONS_V1
} from "../runners/grants-editorial-instructions.js";
import { transformGrantsBulletinToEditorial } from "../runners/grants-editorial-transformer.js";

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

test("transforms initial bulletin artifact into grants editorial artifact", () => {
  const bulletin = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "initial" }),
    normalizedRecords: baseRecords
  });

  const editorial = transformGrantsBulletinToEditorial({ bulletin });

  assert.equal(editorial.channel_id, "grants");
  assert.equal(editorial.bulletin_id, bulletin.bulletin_id);
  assert.equal(editorial.source_bulletin_ready_artifact.artifact_filename, `${bulletin.bulletin_id}.bulletin-ready.json`);
  assert.equal(editorial.editorial_instruction_version, GRANTS_EDITORIAL_INSTRUCTIONS_V1.instruction_version);
  assert.equal(editorial.refined_data_snapshot?.total_records, 1);
});

test("transforms no-change bulletin artifact with stable guidance", () => {
  const bulletin = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "no_change", addedExternalIds: [] }),
    normalizedRecords: baseRecords
  });

  const editorial = transformGrantsBulletinToEditorial({ bulletin });

  assert.equal(editorial.editorial_summary.includes("No-change run"), true);
  assert.equal(editorial.refined_watchlist_1_4_weeks?.items.length, 0);
  assert.equal(
    editorial.refined_watchlist_1_4_weeks?.empty_state_reason,
    "No new or updated opportunities detected in this run."
  );
});

test("transforms changed bulletin artifact with changed-run guidance", () => {
  const changedRecords: NormalizedRecord[] = [
    ...baseRecords,
    {
      externalId: "USDA-010",
      title: "Rural Manufacturing Support Grant",
      publishedAt: "2026-03-25T00:00:00.000Z",
      payload: { sourceId: source.id, amountUsd: 250000 }
    }
  ];

  const bulletin = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["USDA-010"], currentExternalIds: ["DOE-001", "USDA-010"] }),
    normalizedRecords: changedRecords
  });

  const editorial = transformGrantsBulletinToEditorial({ bulletin });

  assert.equal(editorial.editorial_summary.includes("Changed run"), true);
  assert.equal(editorial.refined_what_changed.items.some((item) => item.includes("USDA-010")), true);
  assert.equal(editorial.refined_watchlist_1_4_weeks?.items[0], "USDA-010: Rural Manufacturing Support Grant");
});

test("preserves provenance references and citation refs", () => {
  const bulletin = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed" }),
    normalizedRecords: baseRecords
  });

  const editorial = transformGrantsBulletinToEditorial({ bulletin });

  assert.deepEqual(editorial.provenance_references, bulletin.provenance_references);
  assert.deepEqual(editorial.refined_top_line.citation_refs, bulletin.top_line.citation_refs);
  assert.deepEqual(editorial.refined_why_it_matters.citation_refs, bulletin.why_it_matters.citation_refs);
});

test("transformation output is stable for identical input", () => {
  const bulletin = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed", addedExternalIds: ["DOE-001"] }),
    normalizedRecords: baseRecords
  });

  const first = transformGrantsBulletinToEditorial({ bulletin });
  const second = transformGrantsBulletinToEditorial({ bulletin });

  assert.deepEqual(first, second);
});

test("instruction application behavior is explicit and overridable", () => {
  const bulletin = assembleGrantsBulletinArtifact({
    source,
    changeEvent: makeEvent({ status: "changed" }),
    normalizedRecords: baseRecords
  });

  const editorial = transformGrantsBulletinToEditorial({
    bulletin,
    instructions: {
      ...GRANTS_EDITORIAL_INSTRUCTIONS_V1,
      instruction_version: "grants-editorial-test-version"
    }
  });

  assert.equal(editorial.editorial_instruction_version, "grants-editorial-test-version");
});
