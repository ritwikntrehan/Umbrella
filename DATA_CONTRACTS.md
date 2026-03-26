# DATA_CONTRACTS.md

## 1) Scope and Intent
This document defines the shared data contracts for the umbrella platform. It is intended to be implementation-ready for schema/type creation and validation.

**Assumptions**
1. Canonical metadata and normalized records are stored in PostgreSQL.
2. Large and immutable artifacts are stored in object storage.
3. All channels share core objects; channel specialization is implemented via controlled extensions.

---

## 2) Storage Layers

## 2.1 Raw Layer
**Purpose:** Immutable preservation of source payloads exactly as retrieved.
- Includes API responses, downloaded files, HTML snapshots, and retrieval metadata.
- No business transformations except packaging/compression/checksum.

**Characteristics:**
- Write-once, append-only.
- Partitioned by channel/source/date.
- Referenced by `RawAsset` metadata rows.

## 2.2 Clean Layer
**Purpose:** Deterministic parsed and standardized records produced from raw assets.
- Enforces canonical field names and units.
- Captures parse status and quality metrics.

**Characteristics:**
- Structured tables per normalized record family.
- Idempotent reprocessing supported.

## 2.3 Features Layer
**Purpose:** Derived, deterministic analytical structures used for change detection and ranking inputs.
- Entity links, event deltas, significance scores, trend indicators.

**Characteristics:**
- Versioned transformations.
- Recomputable from clean layer + configuration.

## 2.4 Published Layer
**Purpose:** Editorially approved outputs and public-facing artifacts.
- Bulletins, sections, highlights, publish metadata.

**Characteristics:**
- Versioned and immutable after publish (new revision creates new record).
- Strict traceability to features/clean/raw lineage.

---

## 3) Core Object Contracts

For each object: purpose, required fields, optional fields, example JSON.

### 3.1 Source
**Purpose:** Registry of monitored external sources.

**Required fields**
- `source_id` (string)
- `channel_id` (enum/string)
- `name` (string)
- `source_type` (enum: `api|file|web|database|feed`)
- `endpoint` (string)
- `check_schedule` (cron/string)
- `active` (boolean)
- `schema_version` (string)
- `created_at` (RFC3339 UTC)
- `updated_at` (RFC3339 UTC)

**Optional fields**
- `auth_ref` (secret reference)
- `expected_update_frequency` (string)
- `parser_family` (string)
- `channel_extensions` (object)

**Example JSON**
```json
{
  "source_id": "src_trade_usitc_tariff_001",
  "channel_id": "trade",
  "name": "US Tariff Schedule Feed",
  "source_type": "api",
  "endpoint": "https://example.gov/tariff/feed",
  "check_schedule": "0 */6 * * *",
  "active": true,
  "schema_version": "1.0.0",
  "created_at": "2026-03-26T00:00:00Z",
  "updated_at": "2026-03-26T00:00:00Z"
}
```

### 3.2 SourceCheck
**Purpose:** Result of a lightweight source polling/check event.

**Required fields**
- `source_check_id`
- `source_id`
- `checked_at`
- `status` (enum: `ok|error|no_change|changed`)
- `fingerprint` (string/hash)
- `change_detected` (boolean)
- `run_context` (object)

**Optional fields**
- `http_status`
- `latency_ms`
- `error_code`
- `error_message`
- `candidate_diff_summary`

**Example JSON**
```json
{
  "source_check_id": "schk_20260326_120001_9f2a",
  "source_id": "src_trade_usitc_tariff_001",
  "checked_at": "2026-03-26T12:00:01Z",
  "status": "changed",
  "fingerprint": "sha256:abc123",
  "change_detected": true,
  "run_context": {"scheduler_job": "source-check-trade"},
  "http_status": 200,
  "latency_ms": 842
}
```

### 3.3 IngestionRun
**Purpose:** A full ingestion attempt triggered by a meaningful change.

**Required fields**
- `ingestion_run_id`
- `source_id`
- `trigger_source_check_id`
- `started_at`
- `status` (enum: `running|success|failed|partial`)
- `attempt`

**Optional fields**
- `ended_at`
- `records_fetched`
- `assets_created`
- `error_summary`
- `retry_of_run_id`

**Example JSON**
```json
{
  "ingestion_run_id": "ing_20260326_1205_a91d",
  "source_id": "src_trade_usitc_tariff_001",
  "trigger_source_check_id": "schk_20260326_120001_9f2a",
  "started_at": "2026-03-26T12:05:00Z",
  "status": "success",
  "attempt": 1,
  "ended_at": "2026-03-26T12:06:44Z",
  "records_fetched": 1284,
  "assets_created": 2
}
```

### 3.4 RawAsset
**Purpose:** Metadata record for immutable raw object storage artifact.

**Required fields**
- `raw_asset_id`
- `ingestion_run_id`
- `source_id`
- `storage_uri`
- `content_type`
- `byte_size`
- `checksum`
- `captured_at`

**Optional fields**
- `compression`
- `record_count_hint`
- `retrieval_headers`
- `source_published_at`

**Example JSON**
```json
{
  "raw_asset_id": "raw_20260326_trade_0001",
  "ingestion_run_id": "ing_20260326_1205_a91d",
  "source_id": "src_trade_usitc_tariff_001",
  "storage_uri": "gs://umbrella-raw/trade/source=src_trade_usitc_tariff_001/date=2026-03-26/file-0001.json.gz",
  "content_type": "application/json",
  "byte_size": 440882,
  "checksum": "sha256:ffeedd0011",
  "captured_at": "2026-03-26T12:05:32Z",
  "compression": "gzip"
}
```

### 3.5 NormalizedRecord
**Purpose:** Canonical deterministic record parsed from raw assets.

**Required fields**
- `normalized_record_id`
- `channel_id`
- `record_type`
- `source_id`
- `source_record_key`
- `effective_at`
- `payload` (object)
- `parse_status` (enum: `valid|invalid|partial`)
- `schema_version`
- `lineage` (object containing upstream ids)

**Optional fields**
- `quality_score` (0-1)
- `quality_notes`
- `channel_extensions`

**Example JSON**
```json
{
  "normalized_record_id": "nrec_trade_tariff_20260326_001",
  "channel_id": "trade",
  "record_type": "tariff_rule",
  "source_id": "src_trade_usitc_tariff_001",
  "source_record_key": "hs:850440|us|2026-03-26",
  "effective_at": "2026-03-26T00:00:00Z",
  "payload": {
    "product_code": "850440",
    "duty_rate_pct": 12.5,
    "origin_country": "CN",
    "destination_country": "US"
  },
  "parse_status": "valid",
  "schema_version": "1.1.0",
  "lineage": {
    "ingestion_run_id": "ing_20260326_1205_a91d",
    "raw_asset_ids": ["raw_20260326_trade_0001"]
  },
  "quality_score": 0.98
}
```

### 3.6 Entity
**Purpose:** Canonical real-world object representation used across channels.

**Required fields**
- `entity_id`
- `entity_type` (enum: `company|agency|program|facility|geography|sector|product_category`)
- `canonical_name`
- `status` (enum: `active|inactive|merged|unknown`)
- `created_at`
- `updated_at`

**Optional fields**
- `alternate_names` (array)
- `identifiers` (object: external ids)
- `geo` (object)
- `channel_tags` (array)

**Example JSON**
```json
{
  "entity_id": "ent_company_6f9b12",
  "entity_type": "company",
  "canonical_name": "Acme Industrial Components",
  "status": "active",
  "created_at": "2026-03-26T00:00:00Z",
  "updated_at": "2026-03-26T00:00:00Z",
  "alternate_names": ["Acme IC"],
  "identifiers": {"lei": "549300XXXX"},
  "channel_tags": ["manufacturing", "ma"]
}
```

### 3.7 EntityLink
**Purpose:** Link between normalized records/events and canonical entities.

**Required fields**
- `entity_link_id`
- `entity_id`
- `object_type` (enum: `normalized_record|change_event|highlight`)
- `object_id`
- `role` (string; e.g., `awardee`, `supplier`, `regulator`)
- `confidence` (0-1)
- `link_method` (enum: `exact|rule|model_assisted|manual`)

**Optional fields**
- `evidence` (object)
- `review_status` (enum: `pending|approved|rejected`)

**Example JSON**
```json
{
  "entity_link_id": "elink_12ac",
  "entity_id": "ent_company_6f9b12",
  "object_type": "normalized_record",
  "object_id": "nrec_trade_tariff_20260326_001",
  "role": "supplier",
  "confidence": 0.92,
  "link_method": "rule",
  "review_status": "approved"
}
```

### 3.8 ChangeEvent
**Purpose:** Deterministic representation of a meaningful detected change.

**Required fields**
- `change_event_id`
- `channel_id`
- `event_type`
- `detected_at`
- `effective_at`
- `significance_score` (0-100)
- `change_summary_struct` (object)
- `lineage` (object with upstream ids)
- `publish_candidate` (boolean)

**Optional fields**
- `previous_state_ref`
- `current_state_ref`
- `impact_scope` (object)
- `confidence` (0-1)
- `manual_override` (object)

**Example JSON**
```json
{
  "change_event_id": "cev_trade_20260326_0041",
  "channel_id": "trade",
  "event_type": "tariff_rate_change",
  "detected_at": "2026-03-26T12:07:00Z",
  "effective_at": "2026-03-28T00:00:00Z",
  "significance_score": 83,
  "change_summary_struct": {
    "product_code": "850440",
    "old_rate_pct": 7.5,
    "new_rate_pct": 12.5,
    "delta_pct_points": 5.0
  },
  "lineage": {
    "normalized_record_ids": ["nrec_trade_tariff_20260326_001"],
    "raw_asset_ids": ["raw_20260326_trade_0001"]
  },
  "publish_candidate": true,
  "confidence": 0.97
}
```

### 3.9 Bulletin
**Purpose:** Versioned editorial issue for one channel (or umbrella aggregate).

**Required fields**
- `bulletin_id`
- `channel_id`
- `issue_date` (date)
- `status` (enum: `draft|review|approved|published|archived`)
- `title`
- `editorial_window_start`
- `editorial_window_end`
- `schema_version`

**Optional fields**
- `subtitle`
- `summary`
- `published_at`
- `approved_by`
- `revision_of_bulletin_id`

**Example JSON**
```json
{
  "bulletin_id": "bul_trade_2026w13_v1",
  "channel_id": "trade",
  "issue_date": "2026-03-27",
  "status": "published",
  "title": "Trade & Tariff Intelligence — Week 13",
  "editorial_window_start": "2026-03-20T00:00:00Z",
  "editorial_window_end": "2026-03-27T00:00:00Z",
  "schema_version": "1.0.0",
  "published_at": "2026-03-27T09:00:00Z"
}
```

### 3.10 BulletinSection
**Purpose:** Structured section within a bulletin.

**Required fields**
- `bulletin_section_id`
- `bulletin_id`
- `section_key` (enum/string)
- `order_index` (integer)
- `heading`
- `body_markdown`
- `citation_refs` (array of ids)
- `generated_by` (enum: `human|ai_draft|ai_assisted_human`)

**Optional fields**
- `editor_notes`
- `quality_flags`
- `token_usage`

**Example JSON**
```json
{
  "bulletin_section_id": "bsec_trade_2026w13_01",
  "bulletin_id": "bul_trade_2026w13_v1",
  "section_key": "top_line",
  "order_index": 1,
  "heading": "Top Line",
  "body_markdown": "- Tariff rate on HS 850440 increased by 5.0 percentage points effective Mar 28.",
  "citation_refs": ["cev_trade_20260326_0041", "raw_20260326_trade_0001"],
  "generated_by": "ai_assisted_human"
}
```

### 3.11 Highlight
**Purpose:** Short publishable item used on umbrella homepage and channel feeds.

**Required fields**
- `highlight_id`
- `channel_id`
- `headline`
- `blurb`
- `priority_score` (0-100)
- `source_change_event_ids` (array)
- `publish_status` (enum: `draft|approved|published`)

**Optional fields**
- `expires_at`
- `tags`
- `cross_channel_refs`

**Example JSON**
```json
{
  "highlight_id": "hl_trade_20260326_01",
  "channel_id": "trade",
  "headline": "US duty increase on power supply category takes effect this weekend",
  "blurb": "A 5-point duty increase raises near-term landed cost risk for affected import flows.",
  "priority_score": 88,
  "source_change_event_ids": ["cev_trade_20260326_0041"],
  "publish_status": "published",
  "tags": ["tariff", "cost-risk"]
}
```

### 3.12 ChannelConfig
**Purpose:** Configuration contract for channel-specific behavior within shared platform.

**Required fields**
- `channel_id`
- `display_name`
- `active`
- `check_policies` (object)
- `diff_policies` (object)
- `editorial_policies` (object)
- `publish_schedule` (object)
- `schema_version`

**Optional fields**
- `cta_template_id`
- `taxonomy_overrides`
- `feature_toggles`

**Example JSON**
```json
{
  "channel_id": "grants",
  "display_name": "Grant / Funding Intelligence",
  "active": true,
  "check_policies": {"default_interval_hours": 24},
  "diff_policies": {"min_significance_score": 60},
  "editorial_policies": {"human_approval_required": true},
  "publish_schedule": {"cadence": "weekly", "publish_day": "Friday"},
  "schema_version": "1.0.0",
  "cta_template_id": "cta_grants_custom_map"
}
```

### 3.13 ContactInquiry
**Purpose:** Lead capture object for custom work requests.

**Required fields**
- `contact_inquiry_id`
- `submitted_at`
- `source_context` (enum: `umbrella|channel_page|bulletin`)
- `channel_id` (nullable when umbrella-general)
- `name`
- `email`
- `organization`
- `inquiry_text`
- `consent_flag` (boolean)

**Optional fields**
- `phone`
- `urgency`
- `budget_band`
- `geo_focus`
- `sector_focus`
- `related_bulletin_id`
- `crm_status`

**Example JSON**
```json
{
  "contact_inquiry_id": "inq_20260326_0007",
  "submitted_at": "2026-03-26T15:22:00Z",
  "source_context": "channel_page",
  "channel_id": "ma",
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "organization": "Northfield Capital",
  "inquiry_text": "Need a custom target-screening brief for industrial services in the Midwest.",
  "consent_flag": true,
  "urgency": "high",
  "crm_status": "new"
}
```

---

## 4) Provenance Rules (Mandatory)
1. Every `NormalizedRecord` must include lineage to `ingestion_run_id` and `raw_asset_id`(s).
2. Every `ChangeEvent` must reference contributing `normalized_record_id`(s).
3. Every `BulletinSection` and `Highlight` must contain citation references to `ChangeEvent` (minimum) and indirectly to raw evidence.
4. Published assertions without valid lineage are non-publishable.
5. Raw assets are immutable; corrections occur via new assets/runs and superseding records.

---

## 5) ID Conventions
- Use string IDs with typed prefixes for readability and debugging.
- Pattern: `<prefix>_<channel?>_<yyyymmdd?>_<suffix>`.
- Examples:
  - `src_trade_usitc_tariff_001`
  - `ing_20260326_1205_a91d`
  - `cev_trade_20260326_0041`

**Required characteristics**
- Globally unique within object type.
- Stable over object lifecycle.
- Not reused after deletion/archive.

---

## 6) Timestamp Conventions
- All timestamps stored as UTC RFC3339 (`YYYY-MM-DDTHH:MM:SSZ`).
- Separate fields for:
  - `detected_at` (platform observed),
  - `effective_at` (real-world effect),
  - `published_at` (public release time).
- Date-only fields (`issue_date`) use ISO `YYYY-MM-DD`.

---

## 7) Schema Versioning Approach
- Every core object carries `schema_version`.
- Use semantic versioning:
  - MAJOR: breaking field changes,
  - MINOR: backward-compatible additions,
  - PATCH: constraints/docs fixes.
- Parser/transform code declares supported schema ranges.
- CI blocks deploy when incompatible schema changes are introduced without migration plan.

---

## 8) Channel-Specific Extension Strategy
- Base contracts are immutable/shared.
- Channel-specific fields live under `channel_extensions` (object) in approved objects (`Source`, `NormalizedRecord`, etc.).
- Extension keys must be namespaced by channel (e.g., `trade.*`, `grants.*`).
- Promotion path:
  1. extension field proves cross-channel utility,
  2. propose contract update,
  3. migrate to shared field in MINOR/MAJOR version.

---

## 9) Quality and Confidence Fields
Recommended usage:
- `quality_score` in `NormalizedRecord` (parse completeness/validation quality).
- `confidence` in `EntityLink` (resolution confidence).
- `confidence` in `ChangeEvent` (derived event reliability).
- `quality_flags` in `BulletinSection` (editorial concerns).

Rules:
- Confidence is never a substitute for provenance.
- Threshold-based routing allowed (e.g., low-confidence events require manual review).

---

## 10) Diffing and Update Detection Assumptions
**Assumptions**
1. Source checks are cheaper and more frequent than full ingestion.
2. Not every observed source change is editorially meaningful.

Diffing guidance:
- Use record-level canonical hash on meaningful fields only.
- Distinguish technical noise changes (format/order) from semantic changes.
- Compute change classes: `new`, `updated`, `removed`, `status_changed`, `threshold_crossed`.
- Significance score should be deterministic and channel-configurable.

---

## 11) Publishability Criteria
A `ChangeEvent` or statement is publishable only if:
1. Lineage is complete to raw evidence.
2. Parse status is `valid` or approved `partial` with editor note.
3. Significance exceeds channel threshold OR manually approved override exists.
4. Numeric claims map to deterministic fields (not AI-generated inference).
5. Editorial review status is approved according to channel policy.

---

## 12) Traceability Requirements (Published Statement → Source)
For each published statement, system must resolve:
1. `BulletinSection` → cited `ChangeEvent` IDs.
2. `ChangeEvent` → source `NormalizedRecord` IDs.
3. `NormalizedRecord` → `RawAsset` ID(s).
4. `RawAsset` → immutable object URI and checksum.
5. `RawAsset` + parser version → reproducible extracted field values.

This chain must be queryable for audit and correction workflows.

---

## 13) Folder and Data Partitioning Conventions

### Object storage (raw)
Recommended path template:
`gs://<bucket>/raw/channel=<channel_id>/source=<source_id>/dt=<YYYY-MM-DD>/run=<ingestion_run_id>/<filename>`

### Derived artifacts
- Clean exports: `.../clean/channel=<channel_id>/record_type=<type>/dt=<YYYY-MM-DD>/...`
- Feature snapshots: `.../features/channel=<channel_id>/feature_set=<name>/dt=<YYYY-MM-DD>/...`
- Published render assets: `.../published/channel=<channel_id>/issue=<YYYY-WW>/...`

Partition keys (tables or parquet):
- `channel_id`
- `dt` (event or ingestion date)
- optional `record_type` for high-volume datasets

---

## 14) Relational Tables vs Object Storage

### Relational (PostgreSQL)
- `Source`, `SourceCheck`, `IngestionRun`, `NormalizedRecord` metadata
- `Entity`, `EntityLink`, `ChangeEvent`
- `Bulletin`, `BulletinSection`, `Highlight`
- `ChannelConfig`, `ContactInquiry`

Why: transactional integrity, foreign keys, queryability, and audit joins.

### Object storage
- Raw payloads and snapshots (`RawAsset` binaries)
- Large intermediate files/parquet extracts
- Static publish artifacts (if generated as files)

Why: durability, cost efficiency, and immutable retention.

---

## 15) Validation and Schema Enforcement
1. Define contracts in a shared schema package (JSON Schema or equivalent typed schema system).
2. Enforce validation at ingestion boundaries:
   - raw metadata write,
   - normalized record creation,
   - change event creation,
   - publish creation.
3. Reject invalid required fields; quarantine malformed records.
4. Maintain validation error taxonomy (missing_required, type_mismatch, enum_invalid, lineage_missing).
5. CI requirements:
   - schema compatibility checks,
   - fixture-based parsing tests,
   - lineage completeness tests for publish fixtures.
6. Runtime controls:
   - per-run validation summary metrics,
   - threshold-based run failure rules (e.g., >5% invalid normalized records).

