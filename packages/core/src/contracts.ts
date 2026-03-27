export type ChannelSlug = "grants" | "trade" | "manufacturing" | "market-signals" | "m-and-a";

export const CANONICAL_CHANNEL_SLUGS = ["grants", "trade", "manufacturing", "market-signals", "m-and-a"] as const satisfies readonly ChannelSlug[];

export type CoreContractObjectName = "Source" | "SourceCheck" | "IngestionRun" | "RawAsset" | "ChannelConfig";

export const CORE_CONTRACT_OBJECT_NAMES = ["Source", "SourceCheck", "IngestionRun", "RawAsset", "ChannelConfig"] as const satisfies readonly CoreContractObjectName[];

export interface Source {
  id: string;
  channel: ChannelSlug;
  name: string;
  adapterKey: string;
  url: string;
  cadence: "hourly" | "daily" | "weekly" | "manual";
  enabled: boolean;
  tags?: string[];
  notes?: string;
}

export interface SourceCheck {
  id: string;
  sourceId: string;
  checkedAt: string;
  status: "ok" | "changed" | "error";
  fingerprint?: string;
  summary?: string;
  errorMessage?: string;
}

export interface IngestionRun {
  id: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string;
  status: "queued" | "running" | "success" | "failed";
  rawAssetCount: number;
  errorMessage?: string;
}

export interface RawAsset {
  id: string;
  sourceId: string;
  ingestionRunId: string;
  capturedAt: string;
  checksum: string;
  contentType: "html" | "json" | "pdf" | "xml" | "text" | "other";
  uri: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ChannelConfig {
  slug: ChannelSlug;
  displayName: string;
  description: string;
  owner: string;
  enabled: boolean;
  sourceIds: string[];
  defaultCadence: Source["cadence"];
}

export type JobOrchestrationMode = "batch-scheduled" | "batch-manual-backfill";

export interface RetryAndIdempotencyPolicy {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
  jitterMode: "none" | "full";
  idempotencyKeyFormat: "source-and-window" | "run-id";
  duplicateRunDisposition: "skip" | "resume";
}

export interface ArtifactRetentionPolicy {
  rawDays: number;
  cleanDays: number;
  featuresDays: number;
  publishedDays: number | "indefinite";
  legalHoldOverridesDefault: boolean;
}

export interface PipelineSLOs {
  ingestionSuccessRateTarget: number;
  ingestionSuccessRateWindowDays: number;
  p95PipelineLatencyMinutesTarget: number;
  p95PipelineLatencyWindowDays: number;
  publishDeadlineAdherenceTarget: number;
  publishDeadlineAdherenceWindowDays: number;
}

export interface RunnerStructuredLogFields {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  service: string;
  runner: string;
  stage: string;
  executionMode: JobOrchestrationMode;
  runId: string;
  attempt: number;
  traceId: string;
  channel: ChannelSlug;
  sourceId: string;
  idempotencyKey: string;
  status: "start" | "success" | "failure" | "retry" | "skip";
  durationMs?: number;
  errorCode?: string;
}

export interface RunnerMetricDimensions {
  service: string;
  runner: string;
  stage: string;
  executionMode: JobOrchestrationMode;
  channel: ChannelSlug;
  sourceId: string;
  status: "success" | "failure" | "timeout" | "skipped";
}
