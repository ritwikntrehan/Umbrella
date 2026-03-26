# Umbrella Platform (Deterministic Grants Pilot Slice)

This repo keeps the existing monorepo architecture and now includes the **first deterministic end-to-end pilot flow for the grants channel only**.

## Monorepo Layout

- `apps/web`: minimal web scaffold pages.
- `apps/jobs`: deterministic grants pilot jobs runner (`source check -> ingestion -> normalization -> change detection`).
- `packages/core`: shared typed platform contracts.
- `packages/ui`: minimal shared UI rendering primitives.
- `packages/channel-config`: channel/source configuration.
- `packages/source-adapters`: source adapter contract + mock grants adapter.
- `docs`: implementation-facing docs index and usage guidance.

## What Works Now (Grants Pilot)

The jobs app now executes a deterministic grants-only pipeline and persists JSON artifacts locally:

1. `SourceCheck` artifact
2. `IngestionRun` artifact
3. `RawAsset[]` artifact
4. normalized grants records artifact
5. change event artifact (for later editorial assembly)

All artifacts are stored under a local data root with architecture-aligned folders:

- `raw/`
- `clean/`
- `features/`
- `published/` (reserved for future phases)

Default data root:

- `<repo>/data/grants-pilot`

Override with:

- `UMBRELLA_DATA_DIR=/path/to/data`

## Run the Grants Pilot

Install and run:

```bash
npm install
npm run pilot:grants:source-check
npm run pilot:grants
```

Single-command full deterministic flow:

```bash
npm run pilot:grants
```

## Inspect Output

The runner prints a compact summary and artifact paths.

You can inspect JSON directly, for example:

```bash
cat data/grants-pilot/raw/grants-fed-notices/source-check.json
cat data/grants-pilot/clean/grants-fed-notices/*.normalized-records.json
cat data/grants-pilot/features/grants-fed-notices/latest.change-event.json
```


## Bulletin-Ready Assembly (Grants, Deterministic, Pre-LLM)

A new deterministic assembly step now converts grants pilot outputs into a **bulletin-ready artifact** for later editorial intelligence.

### What the bulletin-ready artifact is

It is a structured, section-ready object (not final editorial copy) built from:

- latest change event output
- latest normalized grants records
- source metadata from grants channel config

Minimum sections/fields included:

- `channel_id`, `bulletin_period`, `generated_at`
- `top_line`, `what_changed`, `why_it_matters`, `custom_work_cta`
- optional/empty-state aware `data_snapshot`, `watchlist_1_4_weeks`
- `record_references`, `provenance_references`
- publication metadata placeholders (`status`, `issue_date`, `slug`, `canonical_url`, `publish_timestamp`, `render_version`, `content_hash`, `distribution_targets`)

### Local storage path convention

Bulletin artifacts are stored under:

- run-scoped: `data/grants-pilot/published/<source_id>/<bulletin_id>.bulletin-ready.json`
- latest pointer: `data/grants-pilot/published/<source_id>/latest.bulletin-ready.json`

`UMBRELLA_DATA_DIR` still overrides the data root.

### Run assembler and inspect

```bash
npm run pilot:grants
npm run pilot:grants:bulletin
npm run pilot:grants:bulletin:inspect
```

The inspect command prints a compact CLI summary of the latest bulletin-ready artifact.

## Tests (Pilot Path)

```bash
npm run test:grants-pilot
```

Covers:

- mock grants adapter deterministic behavior
- normalization output shape
- change detection behavior for stable vs changed input fixture

## Explicitly Deferred

- Editorial AI generation/ranking
- Real publish workflow
- Real database persistence
- Expansion to non-grants channels
- Broad architecture redesign
