# Umbrella Platform (Phase 1 Scaffold)

Initial engineering pass for the Umbrella monorepo. This scaffold implements only the Phase 1 platform foundations and intentionally defers full channel/business logic.

## Monorepo Layout

- `apps/web`: minimal web scaffold with umbrella pages and grants pilot placeholder.
- `apps/jobs`: deterministic pipeline skeleton (source check, ingestion, normalization, change detection).
- `packages/core`: shared typed platform contracts.
- `packages/ui`: minimal shared UI rendering primitives.
- `packages/channel-config`: channel configs for grants, trade, manufacturing, market-signals, m-and-a.
- `packages/source-adapters`: source adapter contract + mock grants adapter.
- `docs`: implementation-facing docs index and usage guidance.

## Quick Start

```bash
npm install
npm run typecheck
npm run dev
```

Use workspace scripts for focused development:

```bash
npm run dev -w @umbrella/web
npm run dev -w @umbrella/jobs
```

## Spec-Driven Development

Architecture/spec files live at repo root and are referenced from `docs/README.md`. Keep implementation aligned to those docs and avoid broad redesigns in scaffold phases.
