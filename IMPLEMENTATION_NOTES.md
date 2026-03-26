# Implementation Notes - Phase 1 Scaffold

## What was scaffolded

- Monorepo structure for apps and shared packages.
- Core deterministic contracts for `Source`, `SourceCheck`, `IngestionRun`, `RawAsset`, and `ChannelConfig`.
- Channel configuration package with all five channel slugs present.
- Mock grants source adapter implementing metadata check, fetch, normalize, and diff fingerprint hooks.
- Jobs app skeleton with runners for source check, ingestion, normalization, and change detection.
- Minimal web app skeleton with homepage, channels landing, grants pilot page, and contact CTA.
- Repo-level setup (`package.json` workspaces, TypeScript base config, `.gitignore`, `.env.example`).
- Docs index to explain how root architecture docs should drive implementation.

## Intentionally deferred

- Real external source integrations and authenticated API clients.
- Persistent storage/database wiring.
- Editorial AI generation/ranking workflows.
- Production-grade front-end framework and design system.
- Cloud deployment automation and infrastructure provisioning.

## Next logical implementation task

Implement Phase 2 deterministic ingestion persistence:

1. Add storage/repository interfaces and local persistence stubs.
2. Persist `SourceCheck`, `IngestionRun`, and `RawAsset` outputs from `apps/jobs`.
3. Add idempotency and run-level tracing around the mock pipeline.
4. Expand grants channel with one real read-only adapter integration.
