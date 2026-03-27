# Implementation Notes - Grants + Trade + Market-Signals + Manufacturing + M&A Deterministic Vertical Slices

## Current state

The platform now proves five channels through the same layered pattern:

- grants
- trade
- market-signals
- manufacturing
- m-and-a

All five channels run:

1. source check
2. ingestion
3. normalization
4. change detection
5. bulletin-ready assembly (deterministic)
6. editorial transformation (instruction-driven, deterministic-template)
7. web rendering from latest editorial artifact

## M&A fifth-channel additions

### Source + adapter

- Added `mAndASources` pilot source in channel config (`m-and-a-pilot-briefings`).
- Added `MockMAndAAdapter` with deterministic fixtures supporting:
  - stable/base run
  - changed run (`?variant=changed`)
  - metadata/source-check support
  - fetch + normalize + diff fingerprint

### Pipeline wiring

- Added jobs commands for M&A pipeline and downstream layers:
  - `m-and-a-source-check`
  - `m-and-a-pilot`
  - `m-and-a-bulletin`
  - `m-and-a-editorial`

### Bulletin-ready + editorial

- Added `MAndABulletinReadyArtifact` assembly using deterministic templates tailored to business assessment and diligence relevance.
- Added `M_AND_A_EDITORIAL_INSTRUCTIONS_V1` emphasizing concise commercially sharp tone, assessment relevance, value-creation usefulness, and no-change vs changed run handling.
- Added M&A editorial transformer preserving provenance and deterministic references while keeping LLM mode deferred by default.

### Web

- Added homepage M&A highlight module.
- Added `/channels/m-and-a` page reading latest M&A editorial artifact.
- Added fallback states when no M&A artifact exists.

## Minimal shared cleanup

- Kept architecture stable and limited shared updates to only what was justified by the fifth real channel.
- Expanded existing local artifact store union typing to include M&A bulletin/editorial artifacts.
- Reused existing shared helpers:
  - `apps/web/src/lib/artifact-reader-shared.ts`
  - `apps/web/src/lib/grants-render-helpers.ts`

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

## How to generate and inspect M&A artifacts

```bash
npm run pilot:m-and-a
npm run pilot:m-and-a:bulletin
npm run pilot:m-and-a:editorial
```

Artifacts are written under local conventions:

- `data/grants-pilot/raw/m-and-a-pilot-briefings/*`
- `data/grants-pilot/clean/m-and-a-pilot-briefings/*`
- `data/grants-pilot/features/m-and-a-pilot-briefings/latest.change-event.json`
- `data/grants-pilot/published/m-and-a-pilot-briefings/latest.bulletin-ready.json`
- `data/grants-pilot/published/m-and-a-pilot-briefings/latest.editorial.json`

## Tests added

- M&A deterministic adapter behavior
- M&A normalization shape
- M&A change detection stable vs changed
- M&A bulletin assembly
- M&A editorial generation
- M&A web fallback behavior

## Intentionally still deferred

- umbrella cross-channel synthesis
- search/archive systems
- publish/distribution workflow
- approval/revision workflow
- broad all-channel abstraction pass
- GCP deployment

## Next likely step

Add a narrow channel-local “latest + recent history” artifact listing/read path for each of the five implemented channels while keeping channels independent and still avoiding umbrella synthesis.
