# SYSTEM_OVERVIEW.md

## 1) Purpose
The Umbrella Intelligence Platform is a multi-channel intelligence publishing system designed to:
- detect meaningful external changes,
- preserve source evidence,
- deterministically transform source data into structured internal records,
- generate editorial outputs (bulletins and highlights), and
- convert reader attention into custom-work leads.

The platform is optimized for **high-signal publishing workflows**, not high-interaction user workflows.

## 2) What the Platform Is / Is Not

### Is
- A shared data and publishing platform powering five channel-specific intelligence products.
- A scheduled monitoring and update-detection system with explicit provenance.
- A deterministic ETL + feature computation engine with an editorial AI layer on top.
- A low-interaction content product (bulletins, structured pages, inquiry forms).

### Is not
- A generalized chat assistant or heavy interactive SaaS app.
- A real-time streaming trading system.
- An autonomous decision-making engine.
- An AI-first data extraction system for source-of-truth numerical facts.

## 3) Primary User Journeys
1. **Bulletin Reader**
   - Lands on umbrella homepage.
   - Sees top cross-channel highlights.
   - Clicks through to channel bulletin.
   - Uses contact CTA for custom analysis.

2. **Channel Analyst/Operator (internal)**
   - Reviews detected changes and ingestion results.
   - Approves or edits AI-assisted draft bulletin sections.
   - Publishes channel bulletin on schedule.

3. **Data Browser**
   - Navigates channel data pages for entities/events.
   - Uses filters (geography, sector, date, event type).
   - Exports or submits inquiry for deeper custom work.

4. **Lead Requester**
   - Submits structured inquiry through channel or umbrella CTA.
   - Inquiry is routed/tagged by channel, topic, and urgency.

## 4) High-Level Platform Architecture
The architecture is split into two strict zones:

- **Deterministic pipeline (source-of-truth zone)**
  - source monitoring
  - ingestion
  - normalization/cleaning
  - feature engineering and change detection

- **Editorial intelligence zone (AI-assisted narrative zone)**
  - synthesis and ranking support
  - bulletin drafting
  - highlight generation
  - never authoritative for numeric truth without deterministic backing

### ASCII Architecture Diagram
```text
                      +-----------------------------+
                      |    External Data Sources    |
                      | (APIs, PDFs, web pages, DB) |
                      +--------------+--------------+
                                     |
                          scheduled checks / polling
                                     v
+------------------+      +--------------------+      +------------------------+
| Source Registry  +----->+ Source Monitoring  +----->+ Change Detection Queue |
| + channel tags   |      | (fingerprints)     |      | (meaningful updates)   |
+------------------+      +--------------------+      +-----------+------------+
                                                                yes |
                                                                    v
                                                        +-----------------------+
                                                        | Deterministic Ingest  |
                                                        | + Raw Asset Preserve  |
                                                        +-----------+-----------+
                                                                    |
                                                                    v
                                                        +-----------------------+
                                                        | Normalize / Clean      |
                                                        | (schema contracts)     |
                                                        +-----------+-----------+
                                                                    |
                                                                    v
                                                        +-----------------------+
                                                        | Feature Layer          |
                                                        | + entity links + diffs |
                                                        +-----------+-----------+
                                                                    |
                                            +-----------------------+-----------------------+
                                            |                                               |
                                            v                                               v
                                  +--------------------+                        +----------------------+
                                  | Editorial AI Layer |                        | Structured Data Pages |
                                  | (summaries,drafts) |                        | (channel/umbrella)    |
                                  +---------+----------+                        +-----------+----------+
                                            |                                               |
                                            v                                               |
                                  +-----------------------+                                 |
                                  | Bulletin Publisher    +---------------------------------+
                                  | (channel + umbrella)  |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------------------+
                                  | Contact/Lead Capture  |
                                  | (CRM pipeline)        |
                                  +-----------------------+
```

## 5) Major Platform Layers

### 5.1 Source Monitoring
- Maintains source definitions, check schedules, update fingerprints.
- Performs lightweight checks (etag/hash/last-modified/record counts).
- Emits `SourceCheck` records and candidate update events.

### 5.2 Ingestion
- Executes only when update criteria are met.
- Pulls raw assets (files, API payloads, HTML snapshots).
- Stores immutable raw artifacts in object storage.
- Emits `IngestionRun` and `RawAsset` records.

### 5.3 Normalization / Cleaning
- Parses raw artifacts into deterministic canonical forms.
- Applies typed schemas and unit/date normalization.
- Produces `NormalizedRecord` rows and parse-quality metrics.

### 5.4 Feature Engineering / Change Detection
- Computes derived features and entity mappings.
- Diffs against prior snapshots to create `ChangeEvent` objects.
- Scores significance with deterministic rules (thresholds, rule weights).

### 5.5 Editorial Intelligence
- Uses LLMs only on deterministic inputs (`ChangeEvent`, feature tables, provenance references).
- Generates draft summaries, title suggestions, bulletin section ordering, and highlight candidates.
- Supports human review and approval workflow.

### 5.6 Publishing / Presentation
- Channel pages: bulletin archive, latest issue, key entities/events.
- Umbrella page: top multi-channel highlights and recent bulletins.
- Published artifacts are versioned and traceable to source-linked events.

### 5.7 Contact / Lead Capture
- Channel- and context-aware inquiry forms.
- Captures company, question, urgency, data needs.
- Routes to CRM with channel tags and relevant bulletin context.

## 6) Deterministic Pipeline vs Editorial AI Layer

### Deterministic (must be reproducible)
- Source checks and update decisions.
- Ingestion and raw preservation.
- Parsing, cleaning, normalization.
- Entity resolution rules where used for truth-bearing fields.
- Diffing, change-event creation, numeric metrics.

### AI-assisted (must be reviewable)
- Summarization of validated change events.
- Ranking suggestions for editorial priority.
- Bulletin prose drafting.
- Alternative headline generation.

**Hard rule:** AI can propose language, not authoritative facts. Facts must be resolvable to deterministic records.

## 7) Recommended Repo Strategy

### Recommendation: Monorepo with strict package boundaries
Use a single repository containing platform modules and channel configs.

Why:
- Shared contracts are the primary scaling constraint; monorepo reduces drift.
- Common CI validations for schemas, provenance, and pipeline quality.
- Easier refactor path after pilot channel succeeds.

Suggested top-level layout:
- `platform/core` (contracts, shared types, ids, timestamps)
- `platform/monitoring` (source checks/schedulers)
- `platform/ingestion`
- `platform/normalize`
- `platform/features`
- `platform/editorial`
- `platform/publishing`
- `platform/contact`
- `channels/{grants,trade,manufacturing,econ,ma}` (channel configs, rules, templates)
- `infra/gcp`
- `docs/`

## 8) Recommended Modular Boundaries
- **Contract module**: canonical schemas and validators.
- **Connector module**: source adapters (API/file/web) with shared interface.
- **Ingestion orchestrator**: run management, retries, checkpointing.
- **Normalization module**: parser/transforms with deterministic unit tests.
- **Entity module**: entity canonicalization and linking primitives.
- **Change module**: diff engine + significance scoring.
- **Editorial module**: prompt templates, draft generation, guardrails.
- **Publish module**: bulletin assembly, renderers, feed/index generation.
- **Contact module**: form handling, anti-spam, CRM delivery.

## 9) Deployment Assumptions (GCP)

**Assumptions**
1. Primary cloud is GCP.
2. Workload is batch/scheduled, not latency-critical online transactions.
3. Team size is small; operational simplicity is prioritized.

### Recommended GCP stack
- **Cloud Scheduler**: source-check and publish schedules.
- **Cloud Run Jobs / Cloud Run services**: ingestion, normalization, feature, editorial jobs.
- **Pub/Sub**: decouple update detection from downstream processing.
- **Cloud Storage**: immutable raw assets and generated artifacts.
- **Cloud SQL (PostgreSQL)**: relational metadata, clean/features/published tables.
- **BigQuery (optional later)**: analytical workloads and longer-horizon trend queries.
- **Secret Manager**: source/API credentials.
- **Cloud Logging + Error Reporting + Monitoring**: centralized ops.
- **Artifact Registry + Cloud Build**: build and deploy pipeline.

## 10) Observability, Logging, and Provenance Expectations
- Every pipeline step emits structured logs with `run_id`, `source_id`, `channel_id`.
- Every publish artifact references originating `ChangeEvent` and underlying `RawAsset` ids.
- Alerting required for:
  - repeated source-check failures,
  - parse quality drop,
  - zero-output anomaly (expected updates but none generated),
  - publish failures.
- Maintain audit trail for editorial actions:
  - draft created by model/version,
  - human edits,
  - approval timestamp/user.

## 11) Design Principles
1. One platform, many channels.
2. Deterministic truth layer, AI editorial layer.
3. Preserve raw evidence.
4. End-to-end traceability.
5. Config over code for channel onboarding.
6. Pilot-first, then abstract and scale.
7. Optimize for weekly cadence reliability over feature novelty.

## 12) Non-Goals
- Real-time user dashboards with sub-second updates.
- Full self-serve BI platform.
- Autonomous publishing with zero human review in early stages.
- Overfitted channel-specific code paths in the core platform.

## 13) Shared vs Channel-Specific Responsibilities

### Shared across all channels
- Core data contracts and id/timestamp standards.
- Source check orchestration and ingestion run lifecycle.
- Raw storage and provenance model.
- Normalization framework and validation engine.
- Entity/object linking patterns.
- Change-event model and significance framework.
- Bulletin assembly workflow and publishing primitives.
- Contact capture service and CRM integration.

### Channel-specific
- Source registry entries and connector configs.
- Parsing maps for unique source formats.
- Significance thresholds/weights.
- Bulletin templates, tone, and section weighting.
- Entity taxonomies and domain tags.
- CTA wording and service packages.

## 14) What AI Does / What AI Does Not Do

### AI does
- Summarize verified change events into concise editorial language.
- Propose priority ranking based on deterministic signals.
- Draft bulletin sections and cross-channel highlights.
- Suggest title variants and CTA phrasing.

### AI does not do
- Authoritative extraction of numeric facts without deterministic parser support.
- Schema mapping for source-of-truth tables in production.
- Hard joins across entities where deterministic linkage rules exist.
- Final publish decisions without human approval (at least through pilot and scale-up phases).

## 15) Key Risks and Mitigations
1. **Risk: Source volatility (format changes, access disruptions).**
   - Mitigation: connector health checks, parser contract tests, fallback ingestion paths, alerting.

2. **Risk: Schema drift between channels.**
   - Mitigation: central contracts package, schema version gates in CI, deprecation policy.

3. **Risk: AI hallucination or overconfident narrative.**
   - Mitigation: grounded prompts with source-linked facts only, publishability checks, human approval.

4. **Risk: Operational overload with five channels.**
   - Mitigation: pilot-first rollout, shared runbooks, channel onboarding checklist.

5. **Risk: Weak provenance breaks trust/compliance.**
   - Mitigation: mandatory citation references in `BulletinSection` and `Highlight`, immutable raw retention policy.

6. **Risk: Under-instrumented pipeline failures.**
   - Mitigation: run-level metrics, SLOs for check/ingest/publish stages, incident playbooks.
