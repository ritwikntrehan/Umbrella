import assert from "node:assert/strict";
import test from "node:test";
import type { MAndABulletinReadyArtifact } from "../runners/m-and-a-bulletin-assembler.js";
import { transformMAndABulletinToEditorial } from "../runners/m-and-a-editorial-transformer.js";

const bulletin: MAndABulletinReadyArtifact = {
  bulletin_id: "bulletin-m-and-a-m-and-a-pilot-briefings-2026-03-27",
  channel_id: "m-and-a",
  source_id: "m-and-a-pilot-briefings",
  bulletin_period: {
    start_date: "2026-03-25",
    end_date: "2026-03-27",
    label: "2026-03-25 to 2026-03-27"
  },
  generated_at: "2026-03-27T12:00:00.000Z",
  top_line: {
    heading: "Top line",
    body: "M&A bulletin updated: deterministic pipeline detected acquisition-relevant source changes.",
    citation_refs: ["change-m-and-a-pilot-briefings-001"]
  },
  what_changed: {
    heading: "What changed",
    body: "Deterministic M&A business-assessment change summary for this bulletin period.",
    citation_refs: ["change-m-and-a-pilot-briefings-001"],
    items: ["Added assessment signals: MA-OPS-455."]
  },
  why_it_matters: {
    heading: "Why it matters",
    body: "Deterministic M&A assessment framing prior to editorial intelligence refinement.",
    citation_refs: ["change-m-and-a-pilot-briefings-001"],
    items: ["Deterministic updates identify where business diligence and value-creation review should focus next."]
  },
  custom_work_cta: {
    heading: "Custom work CTA",
    body: "Need acquisition-grade business assessment support? Contact Umbrella for custom diligence and M&A intelligence coverage.",
    citation_refs: ["change-m-and-a-pilot-briefings-001"]
  },
  data_snapshot: {
    total_records: 2,
    added_records: 1,
    updated_records: 0,
    removed_records: 0,
    source_name: "M&A Business Assessment Briefings (Mock)",
    source_url: "https://example.org/m-and-a/briefings",
    source_adapter: "mock-m-and-a-feed"
  },
  watchlist_1_4_weeks: {
    items: ["MA-OPS-455: Industrial components platform posts two-quarter on-time delivery recovery"]
  },
  record_references: [
    {
      external_id: "MA-ASSET-310",
      title: "Regional cold-chain operator divests non-core last-mile unit",
      published_at: "2026-03-25"
    }
  ],
  provenance_references: [{ ref_type: "change_event_id", ref_value: "change-m-and-a-pilot-briefings-001" }],
  publication_metadata: {
    status: "draft",
    issue_date: "2026-03-27",
    slug: "m-and-a-m-and-a-pilot-briefings-2026-03-27",
    canonical_url: null,
    publish_timestamp: null,
    render_version: "deterministic-m-and-a-bulletin-v1",
    content_hash: "abc",
    distribution_targets: []
  },
  schema_version: "1.0.0"
};

test("M&A editorial transformer preserves deterministic sections and channel metadata", () => {
  const editorial = transformMAndABulletinToEditorial({ bulletin });

  assert.equal(editorial.channel_id, "m-and-a");
  assert.equal(editorial.source_bulletin_ready_artifact.artifact_type, "m-and-a-bulletin-ready");
  assert.equal(editorial.refined_what_changed.items[0], "Added assessment signals: MA-OPS-455.");
  assert.equal(editorial.publication_metadata.render_version, "m-and-a-editorial-layer-v1");
  assert.equal(editorial.editorial_metadata.llm_enabled, false);
});
