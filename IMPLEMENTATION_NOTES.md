# Implementation Notes - Grants + Trade + Market-Signals + Manufacturing Deterministic Vertical Slices

## Current state

The platform now proves four channels through the same layered pattern:

- grants
- trade
- market-signals
- manufacturing

All four channels run:

1. source check
2. ingestion
3. normalization
4. change detection
5. bulletin-ready assembly (deterministic)
6. editorial transformation (instruction-driven, deterministic-template)
7. web rendering from latest editorial artifact

## Manufacturing fourth-channel additions

### Source + adapter

- Added `manufacturingSources` pilot source in channel config (`manufacturing-pilot-network`).
- Added `MockManufacturingAdapter` with deterministic fixtures supporting:
  - stable/base run
  - changed run (`?variant=changed`)
  - metadata/source-check support
  - fetch + normalize + diff fingerprint

### Pipeline wiring

- Added jobs commands for manufacturing pipeline and downstream layers:
  - `manufacturing-source-check`
  - `manufacturing-pilot`
  - `manufacturing-bulletin`
  - `manufacturing-editorial`

### Bulletin-ready + editorial

- Added `ManufacturingBulletinReadyArtifact` assembly using deterministic templates tailored to supplier capability and operational intelligence.
- Added `MANUFACTURING_EDITORIAL_INSTRUCTIONS_V1` emphasizing concise industrial tone, operational relevance, commercial usefulness, and no-change vs changed run handling.
- Added manufacturing editorial transformer preserving provenance and deterministic references while keeping LLM mode deferred by default.

### Web

- Added homepage manufacturing highlight module.
- Added `/channels/manufacturing` page reading latest manufacturing editorial artifact.
- Added fallback states when no manufacturing artifact exists.

## Minimal shared cleanup

- Kept architecture stable and limited shared updates to only what was justified by the fourth real channel.
- Reused existing shared helpers:
  - `apps/web/src/lib/artifact-reader-shared.ts`
  - `apps/web/src/lib/grants-render-helpers.ts`
- Expanded existing local artifact store union typing to include manufacturing bulletin/editorial artifacts.

## What is shared vs channel-specific now

Shared:

- deterministic pipeline runners (source-check, ingestion, normalization, change detection)
- artifact storage conventions (`raw/`, `clean/`, `features/`, `published/`)
- deterministic change-event contract (`DeterministicChangeEvent`)
- web artifact envelope parsing and common render helpers

Channel-specific:

- source config and adapter fixture details
- bulletin-ready assembler text and watchlist framing
- editorial instruction spec and editorial transformer logic
- channel-specific web reader and channel page

## How to generate and inspect manufacturing artifacts

```bash
npm run pilot:manufacturing
npm run pilot:manufacturing:bulletin
npm run pilot:manufacturing:editorial
```

Artifacts are written under local conventions:

- `data/grants-pilot/raw/manufacturing-pilot-network/*`
- `data/grants-pilot/clean/manufacturing-pilot-network/*`
- `data/grants-pilot/features/manufacturing-pilot-network/latest.change-event.json`
- `data/grants-pilot/published/manufacturing-pilot-network/latest.bulletin-ready.json`
- `data/grants-pilot/published/manufacturing-pilot-network/latest.editorial.json`

## Tests added

- manufacturing deterministic adapter behavior
- manufacturing normalization shape
- manufacturing change detection stable vs changed
- manufacturing bulletin assembly
- manufacturing editorial generation
- manufacturing web fallback behavior

## Intentionally still deferred

- umbrella cross-channel synthesis
- search/archive systems
- publish/distribution workflow
- approval/revision workflow
- broad all-channel abstraction pass
- GCP deployment

## Next likely step

Add a narrow channel-local “latest + recent history” artifact listing/read path for each of the four implemented channels while keeping channels independent and still avoiding umbrella synthesis.
