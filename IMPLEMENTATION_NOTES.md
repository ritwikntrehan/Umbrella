# Implementation Notes - Grants + Trade + Market-Signals Deterministic Vertical Slices

## Current state

The platform now proves three channels through the same layered pattern:

- grants
- trade
- market-signals

All three channels run:

1. source check
2. ingestion
3. normalization
4. change detection
5. bulletin-ready assembly (deterministic)
6. editorial transformation (instruction-driven, deterministic-template)
7. web rendering from latest editorial artifact

## Market-signals third-channel additions

### Source + adapter

- Added `marketSignalsSources` pilot source in channel config.
- Added `MockMarketSignalsAdapter` with deterministic fixtures supporting:
  - stable/base run
  - changed run (`?variant=changed`)
  - metadata/source-check support
  - fetch + normalize + diff fingerprint

### Pipeline wiring

- Added jobs commands for market-signals pipeline and downstream layers:
  - `market-signals-source-check`
  - `market-signals-pilot`
  - `market-signals-bulletin`
  - `market-signals-editorial`

### Bulletin-ready + editorial

- Added `MarketSignalsBulletinReadyArtifact` assembly using deterministic templates.
- Added `MARKET_SIGNALS_EDITORIAL_INSTRUCTIONS_V1`.
- Added market-signals editorial transformer preserving provenance and deterministic references.

### Web

- Added homepage market-signals highlight module.
- Added `/channels/market-signals` page reading latest market-signals editorial artifact.
- Added fallback states when no market-signals artifact exists.

## Minimal shared cleanup

- Kept existing architecture and added only narrow helpers justified by a third real channel.
- Added `apps/web/src/lib/artifact-reader-shared.ts` for shared artifact envelope parsing and latest artifact path reading.
- Local artifact store now handles grants + trade + market-signals artifact unions.

## How to generate and inspect market-signals artifacts

```bash
npm run pilot:market-signals
npm run pilot:market-signals:bulletin
npm run pilot:market-signals:editorial
```

Artifacts are written under local conventions:

- `data/grants-pilot/raw/market-signals-pilot-feed/*`
- `data/grants-pilot/clean/market-signals-pilot-feed/*`
- `data/grants-pilot/features/market-signals-pilot-feed/latest.change-event.json`
- `data/grants-pilot/published/market-signals-pilot-feed/latest.bulletin-ready.json`
- `data/grants-pilot/published/market-signals-pilot-feed/latest.editorial.json`

## Tests added

- market-signals deterministic adapter behavior
- market-signals normalization shape
- market-signals change detection stable vs changed
- market-signals bulletin assembly
- market-signals editorial generation
- market-signals web fallback behavior

## Intentionally still deferred

- umbrella cross-channel synthesis
- search/archive systems
- publish/distribution workflow
- approval/revision workflow
- broad all-channel abstraction pass
- GCP deployment

## Next likely step

Implement a narrow channel-local “latest + recent history” artifact listing/read layer for grants, trade, and market-signals pages while keeping channels independent and still avoiding umbrella synthesis.
