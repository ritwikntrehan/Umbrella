import assert from "node:assert/strict";
import test from "node:test";
import type { ManufacturingBulletinReadyArtifact } from "../runners/manufacturing-bulletin-assembler.js";
import { transformManufacturingBulletinToEditorial } from "../runners/manufacturing-editorial-transformer.js";

const bulletin: ManufacturingBulletinReadyArtifact = {
  bulletin_id: "bulletin-manufacturing-manufacturing-pilot-network-2026-03-26",
  channel_id: "manufacturing",
  source_id: "manufacturing-pilot-network",
  bulletin_period: {
    start_date: "2026-03-24",
    end_date: "2026-03-26",
    label: "2026-03-24 to 2026-03-26"
  },
  generated_at: "2026-03-26T12:00:00.000Z",
  top_line: {
    heading: "Top line",
    body: "Manufacturing bulletin updated: deterministic pipeline detected meaningful source changes.",
    citation_refs: ["change-manufacturing-pilot-network-001"]
  },
  what_changed: {
    heading: "What changed",
    body: "Deterministic manufacturing change summary for this bulletin period.",
    citation_refs: ["change-manufacturing-pilot-network-001"],
    items: ["Added developments: MFG-OPS-240."]
  },
  why_it_matters: {
    heading: "Why it matters",
    body: "Deterministic manufacturing impact framing prior to editorial intelligence refinement.",
    citation_refs: ["change-manufacturing-pilot-network-001"],
    items: ["Deterministic changes identify where supplier capability and facility monitoring should focus next."]
  },
  custom_work_cta: {
    heading: "Custom work CTA",
    body: "Need tailored manufacturing intelligence for supplier capability mapping or ecosystem risk monitoring? Contact Umbrella for custom manufacturing analysis support.",
    citation_refs: ["change-manufacturing-pilot-network-001"]
  },
  data_snapshot: {
    total_records: 2,
    added_records: 1,
    updated_records: 0,
    removed_records: 0,
    source_name: "Manufacturing Network Activity Feed (Mock)",
    source_url: "https://example.org/manufacturing/network",
    source_adapter: "mock-manufacturing-feed"
  },
  watchlist_1_4_weeks: {
    items: ["MFG-OPS-240: Stamping network adds weekend shift coverage"]
  },
  record_references: [
    {
      external_id: "MFG-CAP-100",
      title: "Tier-2 precision casting line qualified for aerospace housings",
      published_at: "2026-03-24"
    }
  ],
  provenance_references: [{ ref_type: "change_event_id", ref_value: "change-manufacturing-pilot-network-001" }],
  publication_metadata: {
    status: "draft",
    issue_date: "2026-03-26",
    slug: "manufacturing-manufacturing-pilot-network-2026-03-26",
    canonical_url: null,
    publish_timestamp: null,
    render_version: "deterministic-manufacturing-bulletin-v1",
    content_hash: "abc",
    distribution_targets: []
  },
  schema_version: "1.0.0"
};

test("manufacturing editorial transformer preserves deterministic sections and channel metadata", () => {
  const editorial = transformManufacturingBulletinToEditorial({ bulletin });

  assert.equal(editorial.channel_id, "manufacturing");
  assert.equal(editorial.source_bulletin_ready_artifact.artifact_type, "manufacturing-bulletin-ready");
  assert.equal(editorial.refined_what_changed.items[0], "Added developments: MFG-OPS-240.");
  assert.equal(editorial.publication_metadata.render_version, "manufacturing-editorial-layer-v1");
  assert.equal(editorial.editorial_metadata.llm_enabled, false);
});
