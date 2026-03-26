# CHANNELS.md

## 1) Canonical Channel Definitions
These IDs and names are fixed across configs, schemas, and code:

| channel_id | Display name |
|---|---|
| `grants` | Grant / Funding Intelligence |
| `trade` | Trade / Tariff / Sourcing Intelligence |
| `manufacturing` | Manufacturing / Supplier Ecosystem Intelligence |
| `econ` | Economic / Labor / Market Signals Intelligence |
| `ma` | M&A / Business Assessment Intelligence |

No alternative IDs (`funding`, `economic`, etc.) are permitted in stored objects.

## 2) Shared Bulletin Structure (exact section keys)
Every channel bulletin uses this ordered section set (`BulletinSection.section_key`):
1. `top_line`
2. `what_changed`
3. `why_it_matters`
4. `data_snapshot`
5. `watchlist_1_4_weeks`
6. `custom_work_cta`

All six sections are required for `published` status.

## 3) Shared Editorial Rules
- Every factual statement must cite at least one `ChangeEvent`.
- Numeric claims must resolve to deterministic fields from `NormalizedRecord` or `FeatureSnapshot` lineage.
- AI may draft language but cannot introduce uncited facts.
- Editors must explicitly approve bulletin revision before publish.

## 4) Channel Specifications

### 4.1 `grants` — Grant / Funding Intelligence
**Primary users:** funding teams, strategy teams, grant consultants.

**Core event focus:** funding notice release/update, deadline changes, eligibility changes, award disclosures.

**Typical source types:** government portals, agency notices, budget releases, award datasets.

**Baseline cadence:**
- Source Check: daily (higher for critical sources).
- Bulletin: weekly.

**Minimum launch outputs:**
- Bulletin archive
- Funding opportunity update list
- Deadline/eligibility change summaries

**CTA text anchor:** custom funding map by sector/geography/project type.

### 4.2 `trade` — Trade / Tariff / Sourcing Intelligence
**Primary users:** procurement, trade compliance, operations finance.

**Core event focus:** tariff/duty changes, corridor restrictions, sanctions/restricted-party updates.

**Typical source types:** tariff schedules, regulator bulletins, sanctions lists, logistics advisories.

**Baseline cadence:**
- Source Check: multiple times daily for high-volatility sources.
- Bulletin: weekly (optionally twice-weekly when policy velocity is high).

**Minimum launch outputs:**
- Tariff/regulation deltas
- Corridor risk summaries
- Product-category exposure notes

**CTA text anchor:** tariff exposure + sourcing alternatives analysis.

### 4.3 `manufacturing` — Manufacturing / Supplier Ecosystem Intelligence
**Primary users:** operations leaders, supplier development, industrial investors.

**Core event focus:** facility openings/closures, capacity shifts, certification status changes, supplier ownership changes.

**Typical source types:** supplier directories, permit filings, association updates, company operations disclosures.

**Baseline cadence:**
- Source Check: daily.
- Bulletin: weekly.

**Minimum launch outputs:**
- Supplier ecosystem changes
- Facility lifecycle events
- Capability availability shifts

**CTA text anchor:** supplier landscape and capability gap map.

### 4.4 `econ` — Economic / Labor / Market Signals Intelligence
**Primary users:** strategy, site selection, workforce planning, operating environment analysts.

**Core event focus:** labor market inflections, inflation/price changes, regional demand shifts.

**Typical source types:** official statistics releases, regional indicators, job-posting aggregates.

**Baseline cadence:**
- Source Check: release-calendar driven + daily nowcast inputs.
- Bulletin: weekly.

**Minimum launch outputs:**
- Region/sector signal summaries
- Acceleration/deceleration change flags
- Operational implications by geography

**CTA text anchor:** regional market and workforce scenario brief.

### 4.5 `ma` — M&A / Business Assessment Intelligence
**Primary users:** corp dev teams, private equity teams, strategic finance.

**Core event focus:** deal announcements, target quality signals, valuation-relevant operating changes.

**Typical source types:** transaction disclosures, regulatory filings, earnings/operations updates, ownership databases.

**Baseline cadence:**
- Source Check: daily.
- Bulletin: weekly.

**Minimum launch outputs:**
- New deal and target-monitor updates
- Pre/post-deal risk indicators
- Sector transaction momentum summaries

**CTA text anchor:** target-screening and acquisition thesis support brief.

## 5) Pipeline Alignment Requirements
Channel behavior must align to the canonical build/runtime stages:
- Stages 1–6: channel-specific rules via `ChannelConfig`.
- Stage 7: channel editorial template + human review.
- Stage 8: channel bulletin + optional umbrella highlight.
- Stage 9: channel-tagged inquiry route.

## 6) Open Questions
1. Should any channel require a mandatory twice-weekly bulletin cadence at launch, or stay weekly-until-stable for all five?
2. Should `ma` include private-company inferred signals at launch, or only directly disclosed/filing-backed signals?
