# Umbrella Platform (Five Channel Slices + First Umbrella Synthesis Layer)

This repo keeps the existing architecture and now includes five implemented channel slices:

- grants (first vertical slice)
- trade (second vertical slice)
- market-signals (third vertical slice)
- manufacturing (fourth vertical slice)
- m-and-a (fifth vertical slice)

Each channel follows the same layered path:

1. deterministic pipeline (`source check -> ingestion -> normalization -> change detection`)
2. bulletin-ready artifact (deterministic, pre-LLM)
3. editorial artifact (instruction-driven, deterministic-template mode)
4. web rendering of latest editorial artifact

The new umbrella layer adds:

5. umbrella synthesis input reader (latest channel editorials)
6. umbrella synthesis artifact (deterministic, template-driven)
7. homepage rendering from the latest umbrella synthesis artifact

## What is shared vs channel-specific

Shared:

- contracts and runner infrastructure (`apps/jobs/src/runners/*` for core pipeline stages)
- local artifact store conventions (`raw/`, `clean/`, `features/`, `published/`)
- change detection event shape (`DeterministicChangeEvent`)
- shared web artifact envelope readers (`apps/web/src/lib/artifact-reader-shared.ts`)
- web render helpers for common editorial section rendering

Channel-specific:

- source configuration (`packages/channel-config/src/channels/*.ts`)
- mock source adapters (`packages/source-adapters/src/adapters/*`)
- bulletin assemblers + editorial instruction specs + editorial transformers
- channel pages and channel-specific view model readers in web

## Local artifact convention

Default data root:

- `<repo>/data/grants-pilot`

Override:

- `UMBRELLA_DATA_DIR=/path/to/data`

Per source:

- `raw/<source_id>/...`
- `clean/<source_id>/...`
- `features/<source_id>/latest.change-event.json`
- `published/<source_id>/latest.bulletin-ready.json`
- `published/<source_id>/latest.editorial.json`

Umbrella-level:

- `published/umbrella-synthesis/latest.umbrella-synthesis.json`

## Workspace hardening baseline (local development)

This repo is now configured for **source-first workspace development**:

- Local `@umbrella/*` packages resolve directly to `src/index.ts` through each package `main/types/exports`.
- `tsx` commands in jobs/web no longer depend on prebuilt `dist/` artifacts for local execution.
- Root scripts enforce a stable build order (`packages` first, then `apps`) when `dist/` output is needed.
- TypeScript includes shared local ambient node typings in `types/globals.d.ts` so workspace typecheck is consistent in this environment.

## Install

```bash
npm install
```

## Common workspace commands

```bash
# typecheck everything
npm run typecheck

# build all packages then apps
npm run build

# run all tests
npm run test

# run jobs tests only
npm run test:jobs

# run web tests only
npm run test:web

# start jobs entrypoint (default: grants-pilot)
npm run dev:jobs

# start web server
npm run dev:web
```

## Run grants flow

```bash
npm run pilot:grants
npm run pilot:grants:bulletin
npm run pilot:grants:editorial
```

## Run trade flow

```bash
npm run pilot:trade
npm run pilot:trade:bulletin
npm run pilot:trade:editorial
```

## Run market-signals flow

```bash
npm run pilot:market-signals
npm run pilot:market-signals:bulletin
npm run pilot:market-signals:editorial
```

## Run manufacturing flow

```bash
npm run pilot:manufacturing
npm run pilot:manufacturing:bulletin
npm run pilot:manufacturing:editorial
```

## Run M&A flow

```bash
npm run pilot:m-and-a
npm run pilot:m-and-a:bulletin
npm run pilot:m-and-a:editorial
```

## Run umbrella synthesis flow

```bash
npm run umbrella-synthesis
npm run inspect-umbrella-synthesis
```

This generates a cross-channel artifact that consumes the latest editorial artifacts from:

- grants
- trade
- market-signals
- manufacturing
- m-and-a

## Run web

```bash
npm run dev -w @umbrella/web
```

Then open:

- `http://localhost:3000/` (umbrella synthesis summary as primary layer + channel modules as secondary)
- `http://localhost:3000/channels/grants`
- `http://localhost:3000/channels/trade`
- `http://localhost:3000/channels/manufacturing`
- `http://localhost:3000/channels/market-signals`
- `http://localhost:3000/channels/m-and-a`

If artifacts are missing, pages show fallback guidance with generation commands.


## GCP staging deployment prep (Cloud Run-first)

This repository now includes a practical **staging deployment preparation** path for GCP using:

- Cloud Run service for `apps/web`
- Cloud Run Job for `apps/jobs`
- Cloud Scheduler trigger for scheduled job runs
- Cloud Storage bucket for staged artifact persistence

Start with:

- `deploy/staging/GCP_STAGING_PLAN.md`
- `deploy/staging/GCP_STAGING_RUNBOOK.md`
- `deploy/staging/gcp/env.staging.example`
- `scripts/staging/gcp/*.sh`

This phase is prep-only and keeps local development intact (default local artifact root behavior is unchanged).

## Tests

```bash
npm run test
npm run test:jobs
npm run test:web
npm run typecheck
```

Channel-focused deterministic tests for grants, trade, market-signals, manufacturing, and M&A are included in `@umbrella/jobs`.

## Explicitly deferred

- search/archive views
- publish/distribution workflow
- approval/revision workflow
- broad architecture rewrite
- production-grade GCP deployment execution (this phase now includes staging prep docs/scripts)
- live LLM-backed umbrella synthesis (current mode is deterministic/template-driven)

## Next likely step

Execute the first hosted GCP staging bring-up using the documented Cloud Run/Jobs/Scheduler/Storage path, validate two scheduled cycles, and capture operational observations before production hardening.
