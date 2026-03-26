# DATA_CONTRACTS.md

## 1) Scope
This file defines implementation contracts for all core objects and stage handoffs in the Umbrella pipeline.

## 2) Canonical Enums and IDs

### 2.1 Channel IDs
`grants | trade | manufacturing | econ | ma`

### 2.2 Pipeline stage names
`Source Registration | Source Check | Deterministic Ingestion | Normalization | Feature Computation | Change Event Generation | Editorial Assembly & Review | Publish & Distribution | Lead Capture`

### 2.3 Storage layers
- `raw` (immutable evidence)
- `clean` (validated normalized records)
- `features` (deterministic derived outputs)
- `published` (approved publication objects/artifacts)

## 3) Core Objects

### 3.1 `Source`
Required: `source_id`, `channel_id`, `name`, `source_type`, `endpoint`, `check_schedule`, `active`, `schema_version`, `created_at`, `updated_at`.

### 3.2 `SourceCheck`
Required: `source_check_id`, `source_id`, `checked_at`, `status`, `fingerprint`, `change_detected`, `run_context`, `schema_version`.

Status enum: `success | failed`.

Notes:
- `status` indicates whether the source check operation completed successfully.
- `change_detected` independently indicates whether a meaningful source update was detected.

### 3.3 `IngestionRun`
Required: `ingestion_run_id`, `source_id`, `trigger_source_check_id`, `started_at`, `status`, `attempt`, `schema_version`.

Status enum: `running | success | failed | partial`.

### 3.4 `RawAsset`
Required: `raw_asset_id`, `ingestion_run_id`, `source_id`, `storage_uri`, `content_type`, `byte_size`, `checksum`, `captured_at`, `schema_version`.

### 3.5 `NormalizedRecord`
Required: `normalized_record_id`, `channel_id`, `record_type`, `source_id`, `source_record_key`, `effective_at`, `payload`, `parse_status`, `schema_version`, `lineage`.

`parse_status` enum: `valid | invalid | partial`.

### 3.6 `FeatureSnapshot`
Required: `feature_snapshot_id`, `channel_id`, `feature_set`, `snapshot_at`, `features_payload`, `lineage`, `schema_version`.

Notes:
- `features_payload` is deterministic output only.
- `lineage` must include contributing `normalized_record_id` values.
- Each `feature_set` must have its own schema contract and validator.
- `FeatureSnapshot` remains a generic object type (no feature-specific object split yet).

### 3.7 `Entity`
Required: `entity_id`, `entity_type`, `canonical_name`, `status`, `created_at`, `updated_at`, `schema_version`.

`entity_type` enum: `company | agency | program | facility | geography | sector | product_category`.

### 3.8 `EntityLink`
Required: `entity_link_id`, `entity_id`, `object_type`, `object_id`, `role`, `confidence`, `link_method`, `schema_version`.

`object_type` enum: `normalized_record | feature_snapshot | change_event | highlight`.

### 3.9 `ChangeEvent`
Required: `change_event_id`, `channel_id`, `event_type`, `detected_at`, `effective_at`, `significance_score`, `change_summary_struct`, `lineage`, `publish_candidate`, `schema_version`.

### 3.10 `Bulletin`
Required: `bulletin_id`, `channel_id`, `issue_date`, `status`, `title`, `editorial_window_start`, `editorial_window_end`, `slug`, `canonical_url`, `publish_timestamp`, `render_version`, `content_hash`, `distribution_targets`, `schema_version`.

`status` enum: `draft | published | archived`.

Notes:
- A `published` bulletin is fixed and immutable once generated.
- No approval or revision workflow is defined in this version.

### 3.11 `BulletinSection`
Required: `bulletin_section_id`, `bulletin_id`, `section_key`, `order_index`, `heading`, `body_markdown`, `citation_refs`, `generated_by`, `schema_version`.

`section_key` enum: `top_line | what_changed | why_it_matters | data_snapshot | watchlist_1_4_weeks | custom_work_cta`.

Section policy:
- Required for publish: `top_line`, `what_changed`, `why_it_matters`, `custom_work_cta`.
- Optional: `data_snapshot`, `watchlist_1_4_weeks`.

### 3.12 `Highlight`
Required: `highlight_id`, `channel_id`, `headline`, `blurb`, `priority_score`, `source_change_event_ids`, `publish_status`, `slug`, `canonical_url`, `publish_timestamp`, `render_version`, `content_hash`, `distribution_targets`, `schema_version`.

`publish_status` enum: `draft | published`.

Notes:
- Umbrella highlights are a second editorial synthesis layer and are not required to be direct copies of channel highlights.

### 3.13 `ChannelConfig`
Required: `channel_id`, `display_name`, `active`, `check_policies`, `diff_policies`, `editorial_policies`, `publish_schedule`, `schema_version`.

### 3.14 `ContactInquiry`
Required: `contact_inquiry_id`, `submitted_at`, `source_context`, `name`, `email`, `organization`, `inquiry_text`, `consent_flag`, `schema_version`.

Optional: `channel_id` (nullable), `urgency`, `budget_band`, `geo_focus`, `sector_focus`.

`source_context` enum: `umbrella | channel_page | bulletin`.

Notes:
- Submissions from the umbrella homepage may set `channel_id = null`.
- Channel-specific submissions should provide `channel_id` from the canonical channel enum.

## 4) Mandatory Lineage Rules
1. `NormalizedRecord.lineage` must include `ingestion_run_id` and at least one `raw_asset_id`.
2. `FeatureSnapshot.lineage` must include contributing `normalized_record_id` values.
3. `ChangeEvent.lineage` must include contributing `normalized_record_id` and/or `feature_snapshot_id` values.
4. `BulletinSection.citation_refs` must include at least one `change_event_id`.
5. `Highlight.source_change_event_ids` must be non-empty for `published`.
6. Any publish artifact with missing lineage is invalid and must be blocked.

## 5) Publication Integrity Checks
Publication integrity checks enforce provenance and deterministic consistency:
1. Lineage chain resolves: `BulletinSection/Highlight -> ChangeEvent -> NormalizedRecord/FeatureSnapshot -> RawAsset`.
2. Underlying normalized data has `parse_status in (valid, partial-with-editor-note)`.
3. `significance_score` passes `ChannelConfig.diff_policies.min_significance_score` OR has recorded manual override.
4. Numeric claims map to deterministic fields.

Note: this version does not define a separate approval workflow object model.

## 6) ID, Time, and Version Conventions
- ID pattern: `<prefix>_<channel?>_<date?>_<suffix>`.
- Timestamps: RFC3339 UTC.
- Date-only fields: `YYYY-MM-DD`.
- Every core object includes `schema_version`.
- Semantic versioning is mandatory for schema evolution.

## 7) Validation Gates by Stage
- Stage 2 (`Source Check`): validate `SourceCheck` shape, `status`, and `change_detected` semantics.
- Stage 3 (`Deterministic Ingestion`): validate `IngestionRun` and `RawAsset` checksums/metadata.
- Stage 4 (`Normalization`): validate required `NormalizedRecord` fields and lineage.
- Stage 5 (`Feature Computation`): validate deterministic `FeatureSnapshot` payload against validator for its `feature_set`.
- Stage 6 (`Change Event Generation`): validate `ChangeEvent` lineage and significance fields.
- Stage 7 (`Editorial Assembly & Review`): validate required section keys and citation presence.
- Stage 8 (`Publish & Distribution`): validate publication metadata (`slug`, `canonical_url`, `publish_timestamp`, `render_version`, `content_hash`, `distribution_targets`).
- Stage 9 (`Lead Capture`): validate consent and nullable `channel_id` behavior by `source_context`.

## 8) Open Questions
1. Should `distribution_targets` be normalized into a separate table for delivery auditing, or remain embedded per `Bulletin`/`Highlight`?
2. Should `content_hash` be computed on rendered output only, or both markdown source and rendered output?
