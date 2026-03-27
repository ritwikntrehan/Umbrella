import assert from "node:assert/strict";
import test from "node:test";
import { grantsSources } from "@umbrella/channel-config";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import { assembleGrantsBulletinArtifact } from "../runners/grants-bulletin-assembler.js";
import type { GrantsChangeEvent } from "../runners/change-detection-runner.js";
import { validatePublicationGate } from "../lib/validators.js";

const source = grantsSources[0];
if (!source) {
  throw new Error("Missing grants source fixture.");
}

const normalizedRecords: NormalizedRecord[] = [
  {
    externalId: "DOE-001",
    title: "Battery Supply Chain Pilot",
    publishedAt: "2026-03-24",
    payload: { sourceId: source.id }
  }
];

const changeEvent: GrantsChangeEvent = {
  id: "change-grants-fed-notices-001",
  sourceId: source.id,
  detectedAt: "2026-03-26T00:00:00.000Z",
  status: "changed",
  currentFingerprint: "abc123",
  previousFingerprint: "abc122",
  addedExternalIds: [],
  updatedExternalIds: ["DOE-001"],
  removedExternalIds: [],
  currentExternalIds: ["DOE-001"]
};

test("publication gate passes when deterministic validation and provenance references are complete", () => {
  const bulletin = assembleGrantsBulletinArtifact({ source, changeEvent, normalizedRecords });
  assert.doesNotThrow(() =>
    validatePublicationGate({
      source,
      bulletin,
      expectedChannelId: "grants",
      changeEvent,
      normalizedRecords
    })
  );
});

test("publication gate fails when normalized provenance references are incomplete", () => {
  const bulletin = assembleGrantsBulletinArtifact({ source, changeEvent, normalizedRecords });
  bulletin.provenance_references = bulletin.provenance_references.filter(
    (ref) => !(ref.ref_type === "normalized_record_external_id" && ref.ref_value === "DOE-001")
  );

  assert.throws(
    () =>
      validatePublicationGate({
        source,
        bulletin,
        expectedChannelId: "grants",
        changeEvent,
        normalizedRecords
      }),
    /provenance normalized_record_external_id references must be complete/
  );
});
