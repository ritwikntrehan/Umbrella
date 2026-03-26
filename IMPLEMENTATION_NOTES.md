# Implementation Notes - Deterministic Grants Pilot Slice

## What now works

A narrow deterministic pipeline loop is wired for the **grants channel pilot source only** using existing scaffold components:

1. `source check`
2. `ingestion run`
3. `normalization run`
4. `change detection run`

The flow persists concrete JSON artifacts that later editorial assembly can consume.

### Artifact outputs

For each grants pilot run, the jobs app now writes:

- `SourceCheck`
- `IngestionRun`
- `RawAsset[]`
- normalized grants records
- change event output

### Local data convention

Data root defaults to `data/grants-pilot` and follows the architecture-aligned directory structure:

- `raw/` — source check, ingestion run, raw assets
- `clean/` — normalized records
- `features/` — change events (`latest.change-event.json` + run-scoped event)
- `published/` — reserved (not used yet)

`UMBRELLA_DATA_DIR` can override the data root for local runs/tests.

### Validation

Lightweight runtime validation was added for key deterministic objects:

- source check required fields
- raw asset required fields
- normalized record required fields

Validation remains intentionally minimal and aligned with current contracts.

## How to run

From repo root:

```bash
npm run pilot:grants:source-check
npm run pilot:grants
```

The full command (`pilot:grants`) runs the deterministic end-to-end grants pilot slice in one command.

## Tests added

Focused tests cover:

- mock grants adapter deterministic behavior
- normalization output shape
- change detection for stable vs changed mock fixture input

Run with:

```bash
npm run test:grants-pilot
```

## Deferred (intentionally unchanged)

- editorial AI layer
- publish workflow
- real DB persistence
- non-grants channel expansion
- broad abstractions or architecture redesign

## Next logical task

Implement deterministic **artifact indexing + lightweight query/read API** for the grants pilot outputs (still local-file backed), so downstream editorial assembly can consume artifacts without direct filesystem traversal.


## Bulletin-ready assembly layer (new in this step)

A deterministic grants bulletin assembler now sits after change detection and before any editorial AI.

### What it produces

`GrantsBulletinReadyArtifact` is assembled from current local artifacts and includes section-ready fields for:

- `top_line`
- `what_changed`
- `why_it_matters`
- `custom_work_cta`
- optional `data_snapshot`
- optional `watchlist_1_4_weeks`

Plus provenance and publication metadata placeholders required for later stages.

### Deterministic rules used

- bulletin period is derived from normalized `publishedAt` dates (fallback to change detection date)
- section text is deterministic template text keyed off `changeEvent.status`
- watchlist is derived from added/updated IDs with deterministic ordering
- record/provenance refs are sorted and explicit
- output content hash is deterministic for identical inputs

### Artifact location

- `published/<source_id>/<bulletin_id>.bulletin-ready.json`
- `published/<source_id>/latest.bulletin-ready.json`

### How to run

```bash
npm run pilot:grants
npm run pilot:grants:bulletin
npm run pilot:grants:bulletin:inspect
```

### What is intentionally deferred

- LLM editorial intelligence/refinement
- publish/revision workflow
- non-grants channel assembly
- broad generalized cross-channel bulletin abstraction

### Next likely step

Implement a narrow editorial-intelligence pass that consumes `GrantsBulletinReadyArtifact` and produces an explicit draft editorial layer while preserving provenance links and deterministic numeric claims.

## Editorial intelligence layer v1 (grants-only, this step)

A new grants-only editorial transformation now sits on top of the deterministic bulletin-ready artifact.

### What it produces

`GrantsEditorialArtifact` is now generated from the latest `GrantsBulletinReadyArtifact` and includes:

- source bulletin artifact reference (`source_bulletin_ready_artifact`)
- instruction contract version (`editorial_instruction_version`)
- refined editorial sections (`refined_top_line`, `refined_what_changed`, `refined_why_it_matters`, `refined_custom_work_cta`)
- optional refined carry-forward sections (`refined_data_snapshot`, `refined_watchlist_1_4_weeks`)
- preserved `provenance_references`
- publication metadata placeholders (draft-only, no workflow added)

### Instruction-driven behavior

The editorial layer is driven by explicit spec in:

- `apps/jobs/src/runners/grants-editorial-instructions.ts`

It defines:

- tone and compression guidance
- emphasize vs avoid lists
- no-change and changed run handling rules
- CTA guidance
- provenance/citation handling rules
- explicit LLM integration posture (optional interface, disabled by default)

### LLM integration status

Live LLM calls are intentionally **deferred** in this step.

Current mode is deterministic template transformation with an instruction contract that later LLM synthesis can consume directly.

### Jobs wiring

Added commands:

- `grants-editorial` — generate latest grants editorial artifact from latest bulletin-ready artifact
- `inspect-grants-editorial` — print minimal summary/inspection output

### Artifact location

Under local artifact root (`data/grants-pilot` unless overridden):

- `published/<source_id>/<bulletin_id>.editorial.json`
- `published/<source_id>/latest.editorial.json`

### Tests added

Focused tests now cover:

- initial bulletin-ready -> editorial transformation
- no-change transformation behavior
- changed transformation behavior
- provenance and citation reference preservation
- deterministic stability for identical input
- instruction-version application/override behavior

### Next likely step

Introduce an optional, pluggable LLM refinement adapter for grants editorial synthesis that consumes the same instruction contract while keeping deterministic fallback as the default runtime path.
