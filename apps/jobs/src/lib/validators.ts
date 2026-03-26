import type { RawAsset, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord } from "@umbrella/source-adapters";

export function validateSourceCheck(check: SourceCheck): void {
  if (!check.sourceId || !check.checkedAt || !check.status) {
    throw new Error("Invalid SourceCheck: sourceId, checkedAt, and status are required.");
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
  }
}

export function validateNormalizedRecords(records: NormalizedRecord[]): void {
  for (const record of records) {
    if (!record.externalId || !record.title || !record.payload) {
      throw new Error("Invalid NormalizedRecord: externalId, title, and payload are required.");
    }
  }
}
