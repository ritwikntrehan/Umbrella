# OPERATIONS_STANDARDS.md

## 1) Purpose
This document codifies the operating standards for all Umbrella jobs runners and pipeline executions.

These requirements are normative:
- **MUST** = required for production compliance.
- **SHOULD** = strongly recommended; exceptions require explicit rationale.

## 2) Job orchestration model (batch/scheduled)
### 2.1 Execution modes
Umbrella supports exactly two orchestration modes:
1. `batch-scheduled` (default production mode)
2. `batch-manual-backfill` (operator-triggered replay mode)

Runners MUST include execution mode in all logs and metrics.

### 2.2 Scheduled cadence and concurrency
- Production cadence is scheduler-driven; each channel/source follows `ChannelConfig.defaultCadence` and source-level cadence.
- A scheduler-triggered run MUST acquire a logical lease keyed by `(source_id, stage, window_start, window_end)` before execution.
- If an active lease exists, duplicate scheduled triggers MUST be skipped with an explicit `status=skip` log event.
- Backfill runs MAY execute outside baseline cadence but MUST preserve deterministic stage order:
  1. Source Check
  2. Deterministic Ingestion
  3. Normalization
  4. Feature Computation
  5. Change Event Generation
  6. Editorial Assembly & Review
  7. Publish & Distribution

### 2.3 Orchestration invariants
- No runner may publish before deterministic stages are complete for the same run window.
- All runs MUST emit a stable `run_id` and `idempotency_key`.
- A run MUST be resumable from a stage boundary when prior stage artifacts are present and valid.

## 3) Retry and idempotency strategy
### 3.1 Retry policy
For transient failures (network timeouts, upstream 5xx, lock contention), runners MUST use:
- `max_attempts = 3`
- `initial_backoff = 5s`
- `backoff_multiplier = 2.0`
- `max_backoff = 60s`
- `jitter = full`

For deterministic validation failures (schema mismatch, lineage violation), runners MUST NOT retry automatically.

### 3.2 Idempotency policy
- Idempotency key format MUST be `source_id + stage + window_start + window_end + content_fingerprint?`.
- Writes to immutable layers (`raw`, `clean`, `features`, `published`) MUST be upsert-safe by `(artifact_id, content_hash)` semantics.
- Repeated successful attempts with the same idempotency key MUST resolve to the same artifact references.
- Duplicate publish attempts for identical `content_hash` MUST be treated as idempotent success.

### 3.3 Failure handling
- Final-attempt failures MUST emit `status=failure` with structured `error_code`.
- Re-queued retries MUST emit `status=retry` and increment `attempt`.
- Operators MUST be able to distinguish transient vs deterministic failures using `error_code` class prefixes:
  - `TRANSIENT_*`
  - `VALIDATION_*`
  - `DEPENDENCY_*`

## 4) Artifact retention policy
Retention is measured from artifact creation timestamp in UTC:

| Storage layer | Retention | Policy |
|---|---:|---|
| `raw` | 365 days | Evidence and replay support |
| `clean` | 180 days | Normalized reproducibility window |
| `features` | 180 days | Deterministic derived replay window |
| `published` | Indefinite | Public record, auditability, and provenance |

Additional rules:
- Legal hold MUST override default deletion windows.
- Deletion jobs MUST be batch-scheduled and emit deletion counts by layer.
- A retention delete run MUST never remove `published` artifacts unless explicitly approved as a data-governance exception.

## 5) Core SLOs
SLOs are evaluated on rolling 30-day windows unless otherwise noted.

### 5.1 Ingestion success SLO
- **Target:** `>= 99.0%` successful ingestion runs.
- **Definition:** `successful_ingestion_runs / total_ingestion_runs`, excluding operator-canceled runs.

### 5.2 Pipeline latency SLO
- **Target:** p95 end-to-end deterministic latency `<= 45 minutes`.
- **Definition:** elapsed time from Source Check start to Change Event Generation completion for a run.

### 5.3 Publish deadline adherence SLO
- **Target:** `>= 98.0%` of bulletins published on or before configured deadline.
- **Definition:** fraction of scheduled bulletin windows whose publish timestamp is <= configured deadline timestamp.

### 5.4 Error budget guidance
- Breaching any SLO for two consecutive windows SHOULD trigger a reliability hardening sprint before feature expansion.

## 6) Required structured logging and metrics fields (all runners)
All runners MUST emit JSON-structured logs and metrics with the following common fields.

### 6.1 Required structured log fields
- `timestamp` (RFC3339 UTC)
- `level` (`debug|info|warn|error`)
- `service` (e.g., `umbrella-jobs`)
- `runner` (runner module/function name)
- `stage` (canonical stage slug)
- `execution_mode` (`batch-scheduled|batch-manual-backfill`)
- `run_id`
- `attempt` (1-based)
- `trace_id`
- `channel`
- `source_id`
- `idempotency_key`
- `status` (`start|success|failure|retry|skip`)
- `duration_ms` (required on terminal status events)
- `error_code` (required when `status=failure`)

### 6.2 Required metric dimensions/tags
- `service`
- `runner`
- `stage`
- `execution_mode`
- `channel`
- `source_id`
- `status` (`success|failure|timeout|skipped`)

### 6.3 Required baseline metrics
Every runner MUST publish:
- `runner_invocations_total` (counter)
- `runner_duration_ms` (histogram)
- `runner_failures_total` (counter)
- `runner_retries_total` (counter)
- `runner_skips_total` (counter)

SLO-tracking metrics MUST publish:
- `ingestion_success_ratio` (gauge/window computation)
- `pipeline_latency_ms` (histogram, p95 alerting)
- `publish_deadline_adherence_ratio` (gauge/window computation)

## 7) Cross-reference to implementation contracts
Code-level contract shapes for these standards are defined in:
- `packages/core/src/contracts.ts` (`JobOrchestrationMode`, `RetryAndIdempotencyPolicy`, `ArtifactRetentionPolicy`, `PipelineSLOs`, `RunnerStructuredLogFields`, `RunnerMetricDimensions`).
