# Implementation Notes - First Umbrella Cross-Channel Synthesis Layer

## Current state

The repository now includes:

- five implemented channel slices (grants, trade, market-signals, manufacturing, m-and-a)
- a deterministic umbrella synthesis layer that consumes the latest channel editorial artifacts
- homepage rendering that uses umbrella synthesis as the primary summary layer

This keeps the architecture incremental:

`channel editorial artifacts -> umbrella synthesis artifact -> homepage rendering`

## What the umbrella synthesis artifact is

A new umbrella-level published artifact is now produced at:

- `published/umbrella-synthesis/latest.umbrella-synthesis.json`

It contains:

- `umbrella_artifact_id`
- `generated_at`
- `source_channel_artifacts`
- `included_channels`
- `missing_channels`
- `top_updates_across_channels`
- `short_umbrella_summary`
- `notable_patterns`
- `custom_work_cta`
- `provenance_references`
- publication metadata placeholders (`status`, `slug`, `canonical_url`, `publish_timestamp`, etc.)
- deterministic `content_hash`

## How it differs from channel editorial artifacts

Channel editorial artifacts are channel-specific refinement outputs.

Umbrella synthesis is a second editorial layer that:

- reads only the latest channel editorials
- prioritizes and compresses updates across channels deterministically
- preserves source-channel and provenance links
- emits cross-channel summary/patterns/CTA for homepage consumption

## Deterministic synthesis behavior

Current umbrella synthesis is intentionally deterministic/template-driven:

- no live LLM calls
- explicit scoring/prioritization rules
- stable ordering and hash behavior for identical inputs
- sparse-input-safe handling for missing/partial channels

## Umbrella instruction spec

Added `UMBRELLA_SYNTHESIS_INSTRUCTIONS_V1` covering:

- tone
- compression style
- cross-channel prioritization logic
- sparse-input behavior
- emphasize/avoid guidance
- CTA style guidance
- provenance handling rules
- deferred optional LLM integration notes

## Jobs wiring

Added jobs commands:

- `umbrella-synthesis`
- `inspect-umbrella-synthesis`

Root scripts are also wired so these can be run directly from the monorepo root.

## Homepage integration

Homepage now:

- reads latest umbrella synthesis artifact
- renders umbrella summary/top updates/notable patterns/CTA first
- keeps channel modules as secondary contributors
- includes fallback messaging when umbrella synthesis is not available

## Fallback behavior

Handled states:

- no channel editorials available
- partial channel availability
- sparse synthesis outputs (empty updates/patterns)

## Tests added

Focused tests were added for:

- umbrella synthesis input reading
- umbrella synthesis output with all five channels
- umbrella synthesis output with fewer channels
- stable output/hash for identical inputs
- web homepage and umbrella reader fallback behavior

## Deferred (unchanged by this step)

- production-grade GCP deployment execution (staging prep docs/scripts now in-repo)
- search
- archive system
- publish/distribution workflow
- approval/revision workflow
- auth system
- required live LLM synthesis

## Next likely step

Execute the first hosted GCP staging deployment using the runbook, validate manual and scheduled Cloud Run job cycles, and record operational learnings before production-focused hardening.


## Staging deployment preparation update (GCP Cloud Run-first)

A narrow staging deployment prep layer has been added without revisiting prior architecture decisions.

### Added in this phase

- concrete plan: `deploy/staging/GCP_STAGING_PLAN.md`
- bring-up runbook: `deploy/staging/GCP_STAGING_RUNBOOK.md`
- staging env template: `deploy/staging/gcp/env.staging.example`
- deploy helpers for Cloud Run service/job and scheduler setup in `scripts/staging/gcp/*.sh`

### Runtime mapping now documented explicitly

- `apps/web` -> Cloud Run service
- `apps/jobs` -> Cloud Run Job (run-to-completion)
- staged artifacts (`raw/clean/features/published`) -> Cloud Storage bucket + prefix
- scheduled multi-channel cycle + umbrella synthesis -> Cloud Scheduler invoking Cloud Run Job

### Minimal storage/config seam added

A small shared storage config resolver now exists in `@umbrella/core`:

- `resolveLocalArtifactDataDir()` preserves existing local behavior
- optional staging config keys (`UMBRELLA_ARTIFACT_STORAGE_MODE`, `UMBRELLA_ARTIFACT_LOCAL_DIR`, `UMBRELLA_GCS_ARTIFACT_BUCKET`, `UMBRELLA_GCS_ARTIFACT_PREFIX`) are recognized for deployment alignment

This is intentionally not a full storage backend rewrite.
