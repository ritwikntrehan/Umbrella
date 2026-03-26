# Umbrella Platform (Deterministic Grants + Trade + Market-Signals Pilot Slices)

This repo keeps the existing architecture and now includes three implemented channel slices:

- grants (first vertical slice)
- trade (second vertical slice)
- market-signals (third vertical slice)

Each channel follows the same layered path:

1. deterministic pipeline (`source check -> ingestion -> normalization -> change detection`)
2. bulletin-ready artifact (deterministic, pre-LLM)
3. editorial artifact (instruction-driven, deterministic-template mode)
4. web rendering of latest editorial artifact

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

## Run grants flow

```bash
npm install
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

## Run web

```bash
npm run dev -w @umbrella/web
```

Then open:

- `http://localhost:3000/` (grants + trade + market-signals highlight modules)
- `http://localhost:3000/channels/grants`
- `http://localhost:3000/channels/trade`
- `http://localhost:3000/channels/market-signals`

If artifacts are missing, pages show fallback guidance with generation commands.

## Tests

```bash
npm run test:grants-pilot
npm run test:web
```

Channel-focused deterministic tests for grants, trade, and market-signals are included in `@umbrella/jobs`.

## Explicitly deferred

- umbrella cross-channel synthesis
- search/archive views
- publish/distribution workflow
- approval/revision workflow
- broad all-channel refactor
- GCP deployment

## Next likely step

Add a narrow channel-local “latest + recent history” artifact listing/read path for each implemented channel page, still keeping each channel independent and avoiding umbrella synthesis.
