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
