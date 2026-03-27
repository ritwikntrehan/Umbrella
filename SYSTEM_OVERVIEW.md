# SYSTEM_OVERVIEW.md

## 1) Purpose
Umbrella is a scheduled, deterministic intelligence publishing platform for five channels:
- `grants` (Grant / Funding Intelligence)
- `trade` (Trade / Tariff / Sourcing Intelligence)
- `manufacturing` (Manufacturing / Supplier Ecosystem Intelligence)
- `market-signals` (Economic / Labor / Market Signals Intelligence)
- `m-and-a` (M&A / Business Assessment Intelligence)

The system exists to produce source-traceable bulletins and highlights that convert into qualified custom-work inquiries.

## 2) Scope Boundaries
### In scope
- Scheduled source checks and change detection.
- Deterministic ingestion, normalization, feature computation, and event generation.
- AI-assisted drafting for bulletin-ready editorial content.
- Publication to channel pages + umbrella homepage.
- Structured lead capture tied to bulletin/channel context.

### Out of scope
- Real-time trading or real-time alerting guarantees.
- Autonomous decision-making without source-traceable evidence.
- Chat-style user interaction as a primary product surface.
- AI-only extraction of authoritative numeric facts.

## 3) Canonical Pipeline Stages (must match all docs)
The build and runtime pipeline uses these exact stage names:
1. **Source Registration**
2. **Source Check**
3. **Deterministic Ingestion**
4. **Normalization**
5. **Feature Computation**
6. **Change Event Generation**
7. **Editorial Assembly & Review**
8. **Publish & Distribution**
9. **Lead Capture**

Rules:
- Stages 1–6 are deterministic and reproducible.
- Stage 7 generates bulletin-ready editorial artifacts.
- Stages 8–9 are operational delivery and conversion steps.

## 4) System Architecture
```text
External Sources
  -> (1) Source Registration [Source]
  -> (2) Source Check [SourceCheck]
  -> (3) Deterministic Ingestion [IngestionRun, RawAsset]
  -> (4) Normalization [NormalizedRecord]
  -> (5) Feature Computation [FeatureSnapshot]
  -> (6) Change Event Generation [ChangeEvent]
  -> (7) Editorial Assembly & Review [Bulletin, BulletinSection, Highlight]
  -> (8) Publish & Distribution [published bulletin/highlight artifacts]
  -> (9) Lead Capture [ContactInquiry]
```

## 5) Core Data Objects (canonical names)
These object names are authoritative for implementation:
- `Source`
- `SourceCheck`
- `IngestionRun`
- `RawAsset`
- `NormalizedRecord`
- `FeatureSnapshot`
- `Entity`
- `EntityLink`
- `ChangeEvent`
- `Bulletin`
- `BulletinSection`
- `Highlight`
- `ChannelConfig`
- `ContactInquiry`

Any new object type must be added first in `DATA_CONTRACTS.md` before code use.

## 6) Deterministic vs AI-Assisted Responsibilities
### Deterministic (authoritative)
- Update detection logic (`SourceCheck.change_detected`).
- Raw asset capture and checksums.
- Parsing, typing, normalization, and schema validation.
- Feature computation and significance scoring.
- `ChangeEvent` creation and lineage linkage.

### AI-assisted (non-authoritative)
- Drafting headings, prose, and summary variants.
- Suggesting section ordering.
- Suggesting highlight wording.

Hard rule: published assertions must retain valid citations to deterministic objects.

## 7) Operating Model
- Cadence: weekly bulletin baseline per channel; higher check frequency where configured in `ChannelConfig`.
- Deployment target: GCP batch-oriented services.
- Priority order: traceability > reliability > throughput > UI polish.

## 8) Implementation Directives
- Use a monorepo with strict package boundaries.
- Enforce schema validation at stage boundaries.
- Enforce lineage completeness from `BulletinSection`/`Highlight` to `RawAsset`.
- Keep publication metadata explicit for modular distribution (`slug`, `canonical_url`, `publish_timestamp`, `render_version`, `content_hash`, `distribution_targets`).
- Treat published bulletins as fixed artifacts once generated.

## 9) Open Questions
1. Should `FeatureSnapshot` payloads remain in PostgreSQL JSONB, or move to parquet-first storage once volume grows?
2. Should umbrella highlights allow manual inclusion of lower-significance events for strategic context, and if yes, with what explicit flag?
