# BUILD_SEQUENCE.md

## 1) Foundational Assumptions
1. Small engineering team needs fast path to a working pilot.
2. Reliability and traceability are higher priority than UI sophistication.
3. Weekly publish cadence is the baseline operating rhythm.
4. AI outputs must remain reviewable and non-authoritative for truth-bearing data.
5. Platform will be deployed on GCP with scheduled, batch-oriented workloads.

---

## 2) Recommended Pilot Channel
**Pilot recommendation: Channel 1 — Grant / Funding Intelligence.**

Why:
- Source variety is rich but tractable (portals, announcements, award lists).
- High commercial utility with clear CTA conversion potential.
- Event types are understandable and structured enough for deterministic diffing.
- Provides good proving ground for deadline/effective-date handling and bulletin workflows.

---

## 3) Build Order (Improved Phase Plan)

## Phase 0 — Architecture and Contract Lock (1–2 weeks)

### In scope
- Finalize system architecture document set.
- Approve core object contracts and schema versioning approach.
- Define channel IDs, naming standards, id conventions, and provenance rules.
- Define SLO targets for check/ingest/publish jobs.

### Out of scope
- Production-grade UI.
- Multi-channel rollout.

### Dependencies
- None.

### Acceptance criteria
- All four architecture/spec docs approved.
- Contract review sign-off from engineering + editorial owner.
- Change control process defined for schema updates.

---

## Phase 1 — Platform Skeleton and Ops Foundation (2–4 weeks)

### In scope
- Monorepo structure with modules for monitoring, ingestion, normalize, features, editorial, publish, contact.
- Basic job orchestration on GCP (scheduler + queue + workers).
- Shared logging, metrics, and error handling.
- Database schema for core objects.
- Object storage layout and retention policies.
- Minimal internal run dashboard (status tables/log links only).

### Out of scope
- Full public site styling.
- AI-generated multi-channel summaries.

### Dependencies
- Phase 0 contracts frozen.

### Acceptance criteria
- Can register a source, run scheduled check, and persist `SourceCheck`.
- Can trigger a no-op ingestion pipeline and log full run lifecycle.
- Structured logs include `run_id`, `source_id`, `channel_id`.

---

## Phase 2 — Pilot Channel End-to-End (Grant/Funding) (3–6 weeks)

### In scope
- Implement 3–5 production pilot connectors for grant/funding sources.
- Deterministic normalization for pilot record types.
- Diff and significance logic for grant events.
- Bulletin drafting pipeline with AI-assisted sections.
- Human review + approval step.
- Publish pipeline for channel bulletin page + RSS/email-ready artifact.
- Channel-specific contact form and CRM handoff.

### Out of scope
- Additional channels.
- Cross-channel ranking.

### Dependencies
- Phase 1 infrastructure and contracts.

### Acceptance criteria
- At least 2 consecutive weekly bulletins published from live pipeline data.
- Every published statement traceable to raw asset via lineage chain.
- Manual editorial review workflow operational and documented.
- Contact inquiries captured and routed with channel context.

---

## Phase 3 — Hardening and Shared Primitive Refactor (2–4 weeks)

### In scope
- Refactor pilot-specific logic into reusable shared primitives.
- Introduce connector interface standard and parser template base classes.
- Extract configurable significance engine with channel-specific weights.
- Add contract test fixtures and regression packs.
- Improve observability dashboards and alerts.

### Out of scope
- Net-new UI features unrelated to operational stability.

### Dependencies
- Phase 2 successful end-to-end operation.

### Acceptance criteria
- Pilot still runs without regressions after abstraction.
- New channel scaffold generation requires config + connectors, not core rewrites.
- Automated contract tests run in CI and gate merges.

---

## Phase 4 — Channels 2 and 3 (Trade + Manufacturing) (4–8 weeks)

### In scope
- Add trade/tariff/sourcing channel with higher-frequency checks.
- Add manufacturing/supplier ecosystem channel.
- Reuse shared ingestion/normalization/change modules.
- Implement channel configs, templates, and CTAs.
- Launch channel pages with bulletin archives.

### Out of scope
- Advanced cross-channel intelligence on umbrella homepage.

### Dependencies
- Phase 3 abstractions stable.

### Acceptance criteria
- Channels 2 and 3 each publish at least 2 successful bulletin cycles.
- <10% channel-specific code divergence inside core modules.
- Error rates and run durations within defined SLO envelopes.

---

## Phase 5 — Umbrella Aggregation + Channels 4 and 5 (5–9 weeks)

### In scope
- Add economic/labor/market signals channel.
- Add M&A/business assessment channel.
- Implement umbrella highlight aggregator across all channels.
- Standardize cross-channel ranking inputs.
- Add unified homepage with latest highlights and channel drill-down.

### Out of scope
- Heavy personalization/recommendation engine.

### Dependencies
- Channels 1–3 stable in production.

### Acceptance criteria
- All five channels publishing on schedule.
- Umbrella homepage reflects fresh highlights with valid provenance references.
- Operational on-call playbook and weekly editorial ops rhythm in place.

---

## Phase 6 — Scale Optimization and Productization (ongoing)

### In scope
- Performance tuning (pipeline runtime/cost).
- SLA/SLO maturity and incident automation.
- Editorial tooling improvements.
- Optional BigQuery analytics layer.

### Out of scope
- Radical architecture rewrite without clear bottleneck evidence.

### Dependencies
- Phase 5 complete.

### Acceptance criteria
- Stable monthly operations with predictable publish cadence.
- Measurable improvement in time-to-publish and issue rates.

---

## 4) What to Build Before Any UI Polish
1. Data contracts and validation framework.
2. Ingestion provenance chain and immutable raw storage.
3. Deterministic normalization + diffing with tests.
4. Minimal editorial review workflow.
5. Publish artifact generation with traceability checks.

Only after these are stable should design/styling acceleration begin.

---

## 5) Manual Review vs Automation (Early Stage)

### Manual first (early phases)
- Source quality scoring and connector acceptance.
- Significance threshold tuning per channel.
- Bulletin section approval.
- Entity-link edge cases with low confidence.

### Automate early
- Source check scheduling and retries.
- Schema validation and lineage checks.
- Diff computation and publishability gating.
- Run health metrics and alerting.

### Automate later
- Advanced entity resolution assist workflows.
- Cross-channel highlight prioritization heuristics.
- Partial auto-approval for high-confidence low-risk updates.

---

## 6) Refactor Sequencing After Pilot Success
1. Freeze pilot behavior with regression fixtures.
2. Extract shared interfaces (`SourceConnector`, `Parser`, `DiffStrategy`, `BulletinAssembler`).
3. Migrate pilot channel to new abstractions with zero behavior drift.
4. Backfill docs and runbooks for abstraction use.
5. Only then onboard channels 2–5 using templates.

Key rule: do not refactor and add multiple new channels simultaneously without safety fixtures.

---

## 7) Channel 2–5 Onboarding Method
For each new channel:
1. Define `ChannelConfig` and editorial template.
2. Register initial 3–5 high-value sources.
3. Implement/enable connectors and parsers.
4. Add change-event rules and significance weights.
5. Run shadow bulletin generation for 1–2 cycles (internal only).
6. Validate traceability and editorial quality.
7. Go live with weekly cadence; evaluate twice-weekly only after stability.

---

## 8) Testing Strategy by Phase

### Phase 0–1
- Contract tests for schemas.
- Unit tests for id/time/provenance utilities.
- Integration tests for scheduler → queue → worker execution.

### Phase 2
- Parser fixture tests (real source samples).
- Diff engine deterministic replay tests.
- Publishability gate tests.
- End-to-end smoke tests from source check to published draft.

### Phase 3–4
- Regression test suites for shared primitives.
- Channel onboarding test template.
- Load/cost tests for higher-frequency source checks.

### Phase 5+
- Cross-channel aggregation correctness tests.
- Production canary tests per release.
- Data quality drift monitors and alert validation drills.

---

## 9) Release Strategy
- Use environment tiers: `dev` → `staging` → `prod`.
- Promote by channel and module, not by massive all-at-once deploys.
- Require:
  - green CI contract tests,
  - successful staging end-to-end run,
  - editorial sign-off for template/prompt changes.
- Prefer weekly planned releases aligned with bulletin cycle windows.
- Hotfix process for connector breakage and publish blockers.

---

## 10) Operational Cadence Recommendations
- **Daily:** source-check health review, failed run triage.
- **2–3x weekly:** parser quality and significance tuning review.
- **Weekly:** bulletin production + postmortem of misses/noise.
- **Monthly:** channel performance review (signal quality, lead conversion, run costs).
- **Quarterly:** schema/version/deprecation review and backlog reprioritization.

---

## 11) Dependencies Between Phases (Summary)
- Phase 2 depends on stable contracts and ops foundation from Phases 0–1.
- Phase 3 depends on real pilot learnings from Phase 2.
- Phase 4 depends on Phase 3 abstractions to avoid duplicate channel logic.
- Phase 5 depends on reliability of first three channels for credible umbrella aggregation.
- Phase 6 depends on complete multi-channel production baseline.

---

## 12) Mistakes to Avoid
1. Building five channels in parallel before one full end-to-end proof.
2. Letting AI generate source-of-truth facts without deterministic backing.
3. Skipping lineage fields “temporarily” (it becomes permanent debt).
4. Over-customizing channel logic inside shared core modules.
5. Spending on UI polish before data reliability and publishability gates are stable.
6. Ignoring operational tooling (logs/alerts) until after launch.
7. Changing schemas without compatibility checks and migration plans.
8. Treating weekly bulletin publishing as an ad hoc process instead of a production workflow.
