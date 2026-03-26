import { createHash } from "node:crypto";
import type { Source } from "@umbrella/core";
import type { NormalizedRecord } from "@umbrella/source-adapters";

export interface DeterministicChangeEvent {
  id: string;
  sourceId: string;
  detectedAt: string;
  status: "initial" | "no_change" | "changed";
  currentFingerprint: string;
  previousFingerprint?: string;
  addedExternalIds: string[];
  updatedExternalIds: string[];
  removedExternalIds: string[];
  currentExternalIds: string[];
}

export type GrantsChangeEvent = DeterministicChangeEvent;
export type TradeChangeEvent = DeterministicChangeEvent;
export type MarketSignalsChangeEvent = DeterministicChangeEvent;

function hashRecord(record: NormalizedRecord): string {
  return createHash("sha256").update(JSON.stringify(record.payload)).digest("hex");
}

function fingerprint(records: NormalizedRecord[]): string {
  const normalized = records
    .map((record) => `${record.externalId}:${hashRecord(record)}`)
    .sort()
    .join("|");

  return createHash("sha256").update(normalized).digest("hex");
}

export function runChangeDetection(
  source: Source,
  normalizedRecords: NormalizedRecord[],
  previousEvent: DeterministicChangeEvent | null
): DeterministicChangeEvent {
  const detectedAt = new Date().toISOString();
  const currentFingerprint = fingerprint(normalizedRecords);

  const previousIds = new Set(previousEvent?.currentExternalIds ?? []);
  const currentIds = new Set(normalizedRecords.map((record) => record.externalId));

  const addedExternalIds = [...currentIds].filter((id) => !previousIds.has(id)).sort();
  const removedExternalIds = [...previousIds].filter((id) => !currentIds.has(id)).sort();

  const status: DeterministicChangeEvent["status"] =
    !previousEvent
      ? "initial"
      : previousEvent.currentFingerprint === currentFingerprint
        ? "no_change"
        : "changed";

  const updatedExternalIds =
    status === "changed" && addedExternalIds.length === 0 && removedExternalIds.length === 0
      ? normalizedRecords.map((record) => record.externalId).sort()
      : [];

  return {
    id: `change-${source.id}-${Date.now()}`,
    sourceId: source.id,
    detectedAt,
    status,
    currentFingerprint,
    previousFingerprint: previousEvent?.currentFingerprint,
    addedExternalIds,
    updatedExternalIds,
    removedExternalIds,
    currentExternalIds: [...currentIds].sort()
  };
}
