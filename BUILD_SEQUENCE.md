# BUILD_SEQUENCE.md

## 1) Execution Principles
1. Build deterministic pipeline stages before expanding editorial/UI features.
2. Keep contracts stable; change only with explicit version updates.
3. Ship one fully traceable channel before multi-channel scale.
4. Do not run channels in production without publishability gates.

## 2) Canonical Stage Sequence (authoritative)
All phases implement this exact stage order:
1. Source Registration
2. Source Check
3. Deterministic Ingestion
4. Normalization
5. Feature Computation
6. Change Event Generation
7. Editorial Assembly & Review
8. Publish & Distribution
9. Lead Capture

## 3) Pilot Choice
**Pilot channel: `grants`.**
Reason: manageable source complexity + clear conversion path + strong testbed for deadline/effective-date handling.

## 4) Phase Plan

### Phase 0 — Contract Lock (1–2 weeks)
Deliverables:
- Freeze the four spec docs.
- Freeze canonical channel IDs and object names.
- Define schema versioning and change-control policy.

Exit criteria:
- Engineering + editorial sign-off on contracts.
- No unresolved contradictions across docs.

### Phase 1 — Platform Foundation (2–4 weeks)
Stage coverage: 1–3.

Deliverables:
- `Source` registry and scheduler.
- `SourceCheck` persistence and change queueing.
- `IngestionRun` + `RawAsset` write path with checksums.
- Base logging/metrics and run IDs.

Exit criteria:
- Scheduled checks execute reliably.
- Change-detected checks trigger ingestion runs.
- Raw assets are immutable and queryable by run/source/date.

### Phase 2 — Deterministic Data Core (2–4 weeks)
Stage coverage: 4–6.

Deliverables:
- `NormalizedRecord` parsers for pilot source set.
- `FeatureSnapshot` generation with deterministic tests.
- `ChangeEvent` generation and significance scoring.
- Lineage queries from `ChangeEvent` back to `RawAsset`.

Exit criteria:
- Replay of same inputs yields identical normalized/features/events.
- Failed validations quarantine bad records and surface metrics.

### Phase 3 — Editorial + Publish for Pilot (2–4 weeks)
Stage coverage: 7–9.

Deliverables:
- `Bulletin`, `BulletinSection`, and `Highlight` assembly.
- Human approval workflow.
- Publish artifact generation for channel page + umbrella highlight feed.
- `ContactInquiry` capture with channel context.

Exit criteria:
- Two consecutive weekly pilot bulletins published from live runs.
- Every published statement passes lineage and publishability checks.
- Inquiry routing to CRM works end to end.

### Phase 4 — Shared Primitive Hardening (2–3 weeks)
Deliverables:
- Extract reusable connector/parser/diff interfaces.
- Add contract fixtures and CI regression packs.
- Add SLO dashboards and alerting thresholds.

Exit criteria:
- Pilot behavior unchanged after refactor.
- CI blocks incompatible schema/lineage regressions.

### Phase 5 — Channel Expansion Wave 1 (4–8 weeks)
Channels: `trade`, `manufacturing`.

Deliverables:
- Implement connectors/parsers/config for both channels.
- Reuse stages 1–9 with channel configs only.
- Launch bulletin and archive pages.

Exit criteria:
- Each channel publishes two successful weekly cycles.
- Core module divergence stays below agreed threshold.

### Phase 6 — Channel Expansion Wave 2 + Umbrella Consolidation (4–8 weeks)
Channels: `econ`, `ma`.

Deliverables:
- Launch remaining channels.
- Enable umbrella highlight ranking across all five channels.
- Finalize operational runbooks and on-call response.

Exit criteria:
- All five channels publishing on schedule.
- Umbrella highlights are provenance-valid and current.

### Phase 7 — Continuous Optimization (ongoing)
Deliverables:
- Runtime and cost optimization.
- Data quality drift detection.
- Editorial throughput improvements.

Exit criteria:
- Stable month-over-month publish reliability and predictable ops load.

## 5) Non-Negotiable Release Gates
A release to production requires:
1. Green contract and lineage tests.
2. Successful staging end-to-end run.
3. Editorial sign-off for template/prompt changes.
4. No unresolved severity-1 data integrity defects.

## 6) Open Questions
1. What explicit SLOs (check latency, ingestion success rate, publish deadline adherence) should be codified before Phase 4?
2. Should Phase 5 and Phase 6 remain sequential, or run partially in parallel if staffing increases?
