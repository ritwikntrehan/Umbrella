# Implementation Notes - Grants + Trade Deterministic Vertical Slices

## Current state

The platform now proves two channels through the same layered pattern:

- grants
- trade

Both channels run:

1. source check
2. ingestion
3. normalization
4. change detection
5. bulletin-ready assembly (deterministic)
6. editorial transformation (instruction-driven, deterministic-template)
7. web rendering from latest editorial artifact

## Trade second-channel additions

### Source + adapter

- Added `tradeSources` pilot source in channel config.
- Added `MockTradeAdapter` with deterministic fixtures supporting:
  - stable/base run
  - changed run (`?variant=changed`)
  - metadata/source-check support
  - fetch + normalize + diff fingerprint

### Pipeline wiring

- Added jobs commands for trade pipeline and downstream layers:
  - `trade-source-check`
  - `trade-pilot`
  - `trade-bulletin`
  - `trade-editorial`

### Bulletin-ready + editorial

- Added `TradeBulletinReadyArtifact` assembly using deterministic templates.
- Added `TRADE_EDITORIAL_INSTRUCTIONS_V1`.
- Added trade editorial transformer preserving provenance and deterministic references.

### Web

- Added homepage trade highlight module.
- Added `/channels/trade` page reading latest trade editorial artifact.
- Added fallback states when no trade artifact exists.

## Minimal shared cleanup

- Generalized change event naming to `DeterministicChangeEvent` with grants/trade type aliases.
- Local artifact store now handles both grants and trade artifact unions.
- Reused shared web render helper utilities for grants and trade pages.

## How to generate and inspect trade artifacts

```bash
npm run pilot:trade
npm run pilot:trade:bulletin
npm run pilot:trade:editorial
```

Artifacts are written under local conventions:

- `data/grants-pilot/raw/trade-pilot-bulletins/*`
- `data/grants-pilot/clean/trade-pilot-bulletins/*`
- `data/grants-pilot/features/trade-pilot-bulletins/latest.change-event.json`
- `data/grants-pilot/published/trade-pilot-bulletins/latest.bulletin-ready.json`
- `data/grants-pilot/published/trade-pilot-bulletins/latest.editorial.json`

## Tests added

- trade deterministic adapter behavior
- trade normalization shape
- trade change detection stable vs changed
- trade bulletin assembly
- trade editorial generation
- trade web fallback behavior

## Intentionally still deferred

- umbrella cross-channel synthesis
- search/archive systems
- publish/distribution workflow
- approval/revision workflow
- broad all-channel abstraction pass

## Next likely step

Implement a narrow channel-local “latest + recent history” artifact listing/read layer for grants and trade channel pages, while keeping channels independent and still avoiding umbrella synthesis.
