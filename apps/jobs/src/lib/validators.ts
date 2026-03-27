import type { RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { DeterministicChangeEvent } from "../runners/change-detection-runner.js";
import type { BulletinReadyArtifact, EditorialArtifact } from "./local-artifact-store.js";
import type { UmbrellaSynthesisArtifact } from "../runners/umbrella-synthesis-assembler.js";

export type ImplementedPipelineStage =
  | "source-check"
  | "deterministic-ingestion"
  | "normalization"
  | "change-event-generation"
  | "editorial-assembly-and-review"
  | "publish-and-distribution"
  | "umbrella-synthesis";

export const IMPLEMENTED_PIPELINE_STAGE_BOUNDARIES = [
  "source-check",
  "deterministic-ingestion",
  "normalization",
  "change-event-generation",
  "editorial-assembly-and-review",
  "publish-and-distribution",
  "umbrella-synthesis"
] as const satisfies readonly ImplementedPipelineStage[];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function asStringRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function assertUnique(values: string[], errorMessage: string): void {
  assert(new Set(values).size === values.length, errorMessage);
}

function validatePublicationMetadata(metadata: {
  issue_date: string;
  slug: string;
  content_hash: string;
  status: string;
  canonical_url: string | null;
  publish_timestamp: string | null;
  distribution_targets: unknown[];
}): void {
  assert(metadata.status === "draft", "Publication integrity violation: status must remain 'draft' before publish.");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(metadata.issue_date), "Publication integrity violation: issue_date must be YYYY-MM-DD.");
  assert(metadata.slug.length > 0, "Publication integrity violation: slug must be non-empty.");
  assert(/^[a-f0-9]{64}$/i.test(metadata.content_hash), "Publication integrity violation: content_hash must be a sha256 hex digest.");
  assert(metadata.canonical_url === null, "Publication integrity violation: canonical_url must be null for draft artifacts.");
  assert(metadata.publish_timestamp === null, "Publication integrity violation: publish_timestamp must be null for draft artifacts.");
  assert(Array.isArray(metadata.distribution_targets), "Publication integrity violation: distribution_targets must be an array.");
}

export function assertImplementedStageBoundary(stage: ImplementedPipelineStage): void {
  assert(
    IMPLEMENTED_PIPELINE_STAGE_BOUNDARIES.includes(stage),
    `Unimplemented pipeline stage boundary: ${stage}.`
  );
}

export function validateSourceCheck(check: SourceCheck): void {
  if (!check.sourceId || !check.checkedAt || !check.status) {
    throw new Error("Invalid SourceCheck: sourceId, checkedAt, and status are required.");
  }

  if (!isIsoDate(check.checkedAt)) {
    throw new Error("Invalid SourceCheck: checkedAt must be an ISO timestamp.");
  }
}

export function validateRawAssets(rawAssets: RawAsset[]): void {
  if (rawAssets.length === 0) {
    throw new Error("Invalid RawAsset set: expected at least one asset.");
  }

  for (const asset of rawAssets) {
    if (!asset.id || !asset.sourceId || !asset.checksum) {
      throw new Error("Invalid RawAsset: id, sourceId, and checksum are required.");
    }

    if (!asset.ingestionRunId) {
      throw new Error("Invalid RawAsset: ingestionRunId is required.");
    }

    if (!isIsoDate(asset.capturedAt)) {
      throw new Error("Invalid RawAsset: capturedAt must be an ISO timestamp.");
    }
  }
}

export function validateNormalizedRecords(records: NormalizedRecord[]): void {
  for (const record of records) {
    if (!record.externalId || !record.title || !record.payload) {
      throw new Error("Invalid NormalizedRecord: externalId, title, and payload are required.");
    }
  }
}

export function validateDeterministicPipelineHandoff(params: {
  source: Source;
  check: SourceCheck;
  run: { id: string; sourceId: string; status: string; rawAssetCount: number; startedAt: string };
  rawAssets: RawAsset[];
  normalizedRecords: NormalizedRecord[];
  changeEvent: DeterministicChangeEvent;
}): void {
  const { source, check, run, rawAssets, normalizedRecords, changeEvent } = params;

  assert(check.sourceId === source.id, "Stage handoff violation: SourceCheck.sourceId must match Source.id.");
  assert(run.sourceId === source.id, "Stage handoff violation: IngestionRun.sourceId must match Source.id.");
  assert(run.status === "success", "Stage handoff violation: IngestionRun.status must be 'success'.");
  assert(isIsoDate(run.startedAt), "Stage handoff violation: IngestionRun.startedAt must be an ISO timestamp.");
  assert(
    run.rawAssetCount === rawAssets.length,
    `Stage handoff violation: IngestionRun.rawAssetCount (${run.rawAssetCount}) must equal raw asset count (${rawAssets.length}).`
  );

  const normalizedExternalIds = normalizedRecords.map((record) => record.externalId).sort();
  const eventExternalIds = [...changeEvent.currentExternalIds].sort();

  assert(changeEvent.sourceId === source.id, "Stage handoff violation: ChangeEvent.sourceId must match Source.id.");
  assert(
    JSON.stringify(normalizedExternalIds) === JSON.stringify(eventExternalIds),
    "Stage handoff violation: ChangeEvent.currentExternalIds must align with normalized records."
  );

  for (const asset of rawAssets) {
    assert(asset.sourceId === source.id, `Stage handoff violation: RawAsset ${asset.id} sourceId mismatch.`);
    assert(asset.ingestionRunId === run.id, `Stage handoff violation: RawAsset ${asset.id} ingestionRunId mismatch.`);
  }

  for (const record of normalizedRecords) {
    const payload = asStringRecord(record.payload);
    const payloadSourceId = payload.sourceId;
    if (typeof payloadSourceId === "string") {
      assert(
        payloadSourceId === source.id,
        `Stage handoff violation: NormalizedRecord ${record.externalId} payload.sourceId mismatch.`
      );
    }
  }
}

export function validateBulletinPublicationIntegrity(params: {
  source: Source;
  bulletin: BulletinReadyArtifact;
  expectedChannelId: Source["channel"];
  changeEvent?: DeterministicChangeEvent;
  normalizedRecords?: NormalizedRecord[];
}): void {
  const { source, bulletin, expectedChannelId, changeEvent, normalizedRecords } = params;

  assert(bulletin.source_id === source.id, "Lineage violation: bulletin source_id must match Source.id.");
  assert(bulletin.channel_id === expectedChannelId, "Lineage violation: bulletin channel_id must match source.channel.");
  assert(isIsoDate(bulletin.generated_at), "Lineage violation: bulletin generated_at must be an ISO timestamp.");

  validatePublicationMetadata(bulletin.publication_metadata);

  const changeEventRef = bulletin.provenance_references.find((ref) => ref.ref_type === "change_event_id");
  const fingerprintRef = bulletin.provenance_references.find((ref) => ref.ref_type === "change_fingerprint");
  assert(changeEventRef, "Lineage violation: bulletin provenance must include change_event_id.");
  assert(fingerprintRef, "Lineage violation: bulletin provenance must include change_fingerprint.");

  if (changeEvent) {
    assert(
      changeEventRef.ref_value === changeEvent.id,
      "Lineage violation: bulletin change_event_id provenance must match handoff ChangeEvent.id."
    );
    assert(
      fingerprintRef.ref_value === changeEvent.currentFingerprint,
      "Lineage violation: bulletin change_fingerprint provenance must match handoff ChangeEvent.currentFingerprint."
    );
  }

  if (normalizedRecords) {
    const expectedExternalIds = normalizedRecords.map((record) => record.externalId).sort();
    const referencedExternalIds = bulletin.record_references.map((record) => record.external_id).sort();

    assert(
      JSON.stringify(expectedExternalIds) === JSON.stringify(referencedExternalIds),
      "Lineage violation: bulletin record_references must exactly match normalized external IDs."
    );
  }
}

export function validatePublicationGate(params: {
  source: Source;
  bulletin: BulletinReadyArtifact;
  expectedChannelId: Source["channel"];
  changeEvent: DeterministicChangeEvent;
  normalizedRecords: NormalizedRecord[];
}): void {
  const { source, bulletin, expectedChannelId, changeEvent, normalizedRecords } = params;
  validateDeterministicPipelineHandoff({
    source,
    check: {
      id: "publication-gate-synthetic-check",
      sourceId: source.id,
      checkedAt: changeEvent.detectedAt,
      status: "changed"
    },
    run: {
      id: "publication-gate-synthetic-run",
      sourceId: source.id,
      status: "success",
      rawAssetCount: normalizedRecords.length > 0 ? 1 : 0,
      startedAt: changeEvent.detectedAt
    },
    rawAssets:
      normalizedRecords.length > 0
        ? [
            {
              id: "publication-gate-synthetic-raw",
              sourceId: source.id,
              ingestionRunId: "publication-gate-synthetic-run",
              capturedAt: changeEvent.detectedAt,
              checksum: changeEvent.currentFingerprint,
              contentType: "json",
              uri: source.url
            }
          ]
        : [],
    normalizedRecords,
    changeEvent
  });
  validateBulletinPublicationIntegrity({
    source,
    bulletin,
    expectedChannelId,
    changeEvent,
    normalizedRecords
  });

  const normalizedProvenanceRefs = bulletin.provenance_references
    .filter((ref) => ref.ref_type === "normalized_record_external_id")
    .map((ref) => ref.ref_value)
    .sort();
  const expectedExternalIds = normalizedRecords.map((record) => record.externalId).sort();

  assertUnique(
    normalizedProvenanceRefs,
    "Publication gate violation: normalized_record_external_id provenance references must be unique."
  );
  assert(
    JSON.stringify(normalizedProvenanceRefs) === JSON.stringify(expectedExternalIds),
    "Publication gate violation: provenance normalized_record_external_id references must be complete."
  );
}

export function validateEditorialPublicationIntegrity(params: {
  source: Source;
  editorial: EditorialArtifact;
  bulletin: BulletinReadyArtifact;
  expectedChannelId: Source["channel"];
}): void {
  const { source, editorial, bulletin, expectedChannelId } = params;

  assert(editorial.channel_id === expectedChannelId, "Lineage violation: editorial channel_id must match source.channel.");
  assert(editorial.bulletin_id === bulletin.bulletin_id, "Lineage violation: editorial bulletin_id must match bulletin artifact.");
  assert(
    editorial.source_bulletin_ready_artifact.source_id === source.id,
    "Lineage violation: editorial source_bulletin_ready_artifact.source_id must match Source.id."
  );
  assert(
    editorial.source_bulletin_ready_artifact.bulletin_id === bulletin.bulletin_id,
    "Lineage violation: editorial source_bulletin_ready_artifact.bulletin_id mismatch."
  );
  assert(
    editorial.source_bulletin_ready_artifact.artifact_filename === `${bulletin.bulletin_id}.bulletin-ready.json`,
    "Lineage violation: editorial artifact filename must reference its source bulletin file."
  );
  assert(isIsoDate(editorial.generated_at), "Lineage violation: editorial generated_at must be an ISO timestamp.");

  validatePublicationMetadata(editorial.publication_metadata);
}

export function validateUmbrellaPublicationIntegrity(artifact: UmbrellaSynthesisArtifact): void {
  assert(isIsoDate(artifact.generated_at), "Publication integrity violation: umbrella generated_at must be an ISO timestamp.");
  validatePublicationMetadata(artifact.publication_metadata);

  const included = new Set(artifact.included_channels);
  for (const channelArtifact of artifact.source_channel_artifacts) {
    assert(
      included.has(channelArtifact.channel_id),
      `Lineage violation: source_channel_artifacts includes channel '${channelArtifact.channel_id}' not present in included_channels.`
    );
    assert(
      channelArtifact.artifact_filename.endsWith(".editorial.json"),
      "Lineage violation: umbrella source channel references must point to editorial artifacts."
    );
  }
}
