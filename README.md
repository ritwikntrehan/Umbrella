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
- `published/` (contains bulletin-ready + editorial artifacts consumed by the web layer for grants)

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

## Editorial Layer v1 (Grants-only, Instruction-driven, Pre-LLM)

The first editorial intelligence layer now consumes the deterministic grants bulletin-ready artifact and produces a separate **grants editorial artifact**.

### How it differs from bulletin-ready

- bulletin-ready remains the deterministic facts layer
- editorial is a distinct refinement layer with synthesized phrasing
- deterministic facts and provenance are preserved and referenced, not rewritten
- editorial output is explicitly tied to an instruction contract version

### Editorial output contract highlights

At minimum the artifact includes:

- `channel_id`, `bulletin_id`
- `source_bulletin_ready_artifact` reference
- `generated_at`, `editorial_instruction_version`
- `editorial_summary`
- `refined_top_line`, `refined_what_changed`, `refined_why_it_matters`, `refined_custom_work_cta`
- optional `refined_data_snapshot`, `refined_watchlist_1_4_weeks`
- `provenance_references`
- publication metadata placeholders aligned with current bulletin conventions

### Instruction layer

`apps/jobs/src/runners/grants-editorial-instructions.ts` defines explicit grants guidance for:

- tone and compression style
- emphasis/avoidance rules
- no-change vs changed run behavior
- CTA style
- provenance handling
- LLM integration stance (`enabled_by_default: false`, deterministic-template mode active)

### Local storage path convention

Editorial artifacts are stored under:

- run-scoped: `data/grants-pilot/published/<source_id>/<bulletin_id>.editorial.json`
- latest pointer: `data/grants-pilot/published/<source_id>/latest.editorial.json`

### Run and inspect grants editorial output

```bash
npm run pilot:grants
npm run pilot:grants:bulletin
npm run pilot:grants:editorial
npm run pilot:grants:editorial:inspect
```

Live LLM synthesis is intentionally deferred; this step delivers the modular instruction contract and deterministic editorial transformation structure needed for later integration.

## Tests (Pilot Path)

```bash
npm run test:grants-pilot
```

Covers:

- mock grants adapter deterministic behavior
- normalization output shape
- change detection behavior for stable vs changed input fixture

## Explicitly Deferred

- Live LLM editorial synthesis/generation
- Real publish workflow
- Real database persistence
- Expansion to non-grants channels
- Broad architecture redesign

## Web Integration (Grants Editorial Artifact -> Site)

The web app now reads local grants artifacts and renders real content (not placeholder copy) for:

- homepage grants highlight module (`/`)
- grants channel page (`/channels/grants`)

### What is rendered

From the latest grants editorial artifact (`latest.editorial.json`) and related bulletin metadata:

- channel identity
- bulletin period/date
- refined top line
- editorial summary
- refined section content (what changed / why it matters / custom CTA)
- optional watchlist/data snapshot sections
- minimal provenance snippet

### Fallback behavior

If no editorial artifact exists yet, both pages render a useful empty-state prompt with the commands needed to generate artifacts locally.

### Generate data before viewing the site

```bash
npm run pilot:grants
npm run pilot:grants:bulletin
npm run pilot:grants:editorial
npm run dev -w @umbrella/web
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/channels/grants`

### Current real vs placeholder scope

- **Real now:** grants channel artifact consumption + rendering on home and grants page
- **Still placeholder:** other channel pages and umbrella cross-channel synthesis

### Next likely step

Add a narrow local artifact index/read service that supports listing prior grants bulletins (basic history/archive view) without introducing a database.
