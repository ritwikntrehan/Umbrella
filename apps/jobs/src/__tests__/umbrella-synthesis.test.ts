import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { grantsSources, mAndASources, manufacturingSources, marketSignalsSources, tradeSources } from "@umbrella/channel-config";
import { createLocalArtifactStore } from "../lib/local-artifact-store.js";
import { assembleUmbrellaSynthesisArtifact } from "../runners/umbrella-synthesis-assembler.js";
import { readUmbrellaSynthesisInput } from "../runners/umbrella-synthesis-input-reader.js";

function buildEditorial(params: { channelId: string; sourceId: string; bulletinId: string; generatedAt: string }): any {
  return {
    channel_id: params.channelId,
    bulletin_id: params.bulletinId,
    generated_at: params.generatedAt,
    editorial_summary: `${params.channelId} summary`,
    refined_top_line: { heading: "Top line", body: `${params.channelId} updated`, citation_refs: [] },
    refined_what_changed: { heading: "What changed", body: "body", items: [`${params.channelId}-item-1`], citation_refs: [] },
    refined_custom_work_cta: { heading: "CTA", body: `${params.channelId} cta`, citation_refs: [] },
    refined_watchlist_1_4_weeks: { items: [`${params.channelId}-watch-1`] },
    provenance_references: [{ ref_type: "change_event_id", ref_value: `${params.channelId}-change-1` }],
    publication_metadata: {
      status: "draft",
      issue_date: "2026-03-27",
      slug: `${params.channelId}-${params.bulletinId}`,
      canonical_url: null,
      publish_timestamp: null,
      render_version: "test",
      content_hash: "hash",
      distribution_targets: []
    },
    schema_version: "1.0.0"
  };
}

async function seedEditorials(channelCount: number): Promise<Awaited<ReturnType<typeof createLocalArtifactStore>>> {
  process.env.UMBRELLA_DATA_DIR = mkdtempSync(join(tmpdir(), "umbrella-jobs-test-"));
  const store = await createLocalArtifactStore();

  const tuples = [
    [grantsSources[0], "grants"],
    [tradeSources[0], "trade"],
    [marketSignalsSources[0], "market-signals"],
    [manufacturingSources[0], "manufacturing"],
    [mAndASources[0], "m-and-a"]
  ] as const;

  for (const [index, tuple] of tuples.entries()) {
    if (index >= channelCount) break;
    const source = tuple[0];
    const channelId = tuple[1];
    if (!source) continue;
    await store.writeEditorialArtifact(
      source,
      buildEditorial({
        channelId,
        sourceId: source.id,
        bulletinId: `bulletin-${channelId}-2026-03-27`,
        generatedAt: `2026-03-27T1${index}:00:00.000Z`
      })
    );
  }

  return store;
}

test("umbrella input reader normalizes all five channels", async () => {
  const store = await seedEditorials(5);

  const input = await readUmbrellaSynthesisInput(store);

  assert.equal(input.channels.length, 5);
  assert.equal(input.missing_channels.length, 0);
  assert.equal(input.channels[0]?.artifact_reference.artifact_type, "channel-editorial");
});

test("umbrella synthesis handles partial channel availability", async () => {
  const store = await seedEditorials(3);

  const input = await readUmbrellaSynthesisInput(store);
  const artifact = assembleUmbrellaSynthesisArtifact({ input, now: "2026-03-27T12:00:00.000Z" });

  assert.equal(artifact.included_channels.length, 3);
  assert.equal(artifact.missing_channels.length, 2);
  assert.equal(artifact.short_umbrella_summary.includes("3/5"), true);
});

test("umbrella synthesis with five channels emits top updates and patterns", async () => {
  const store = await seedEditorials(5);

  const input = await readUmbrellaSynthesisInput(store);
  const artifact = assembleUmbrellaSynthesisArtifact({ input, now: "2026-03-27T12:00:00.000Z" });

  assert.equal(artifact.included_channels.length, 5);
  assert.equal(artifact.top_updates_across_channels.length > 0, true);
  assert.equal(artifact.notable_patterns.length > 0, true);
});

test("umbrella synthesis output is stable for identical inputs", async () => {
  const store = await seedEditorials(5);
  const input = await readUmbrellaSynthesisInput(store);

  const first = assembleUmbrellaSynthesisArtifact({ input, now: "2026-03-27T12:00:00.000Z" });
  const second = assembleUmbrellaSynthesisArtifact({ input, now: "2026-03-27T12:00:00.000Z" });

  assert.equal(first.publication_metadata.content_hash, second.publication_metadata.content_hash);
  assert.deepEqual(first, second);
});
