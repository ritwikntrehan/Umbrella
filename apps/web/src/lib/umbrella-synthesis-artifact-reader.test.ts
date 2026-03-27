import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLatestUmbrellaSynthesisForWeb } from "./umbrella-synthesis-artifact-reader.js";

test("umbrella synthesis reader returns fallback when no artifact exists", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "umbrella-web-test-"));
  process.env.UMBRELLA_DATA_DIR = tempDir;

  const model = readLatestUmbrellaSynthesisForWeb();

  assert.ok(model.fallbackReason);
  assert.equal(model.includedChannels.length, 0);
});

test("umbrella synthesis reader returns mapped fields when artifact exists", async () => {
  const tempDir = mkdtempSync(join(tmpdir(), "umbrella-web-test-"));
  process.env.UMBRELLA_DATA_DIR = tempDir;

  const dir = join(tempDir, "published", "umbrella-synthesis");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "latest.umbrella-synthesis.json"),
    JSON.stringify({
      sourceId: "umbrella-synthesis",
      createdAt: "2026-03-27T12:00:00.000Z",
      payload: {
        umbrella_artifact_id: "umbrella-synthesis-2026-03-27",
        generated_at: "2026-03-27T12:00:00.000Z",
        included_channels: ["grants", "trade"],
        missing_channels: ["market-signals", "manufacturing", "m-and-a"],
        top_updates_across_channels: ["[grants] Added grant notice G-123"],
        short_umbrella_summary: "Umbrella synthesis generated from 2/5 channels.",
        notable_patterns: ["Cross-channel signals are currently light."],
        custom_work_cta: "Umbrella can help close coverage gaps."
      }
    }),
    "utf8"
  );

  const model = readLatestUmbrellaSynthesisForWeb();

  assert.equal(model.umbrellaArtifactId, "umbrella-synthesis-2026-03-27");
  assert.equal(model.summary, "Umbrella synthesis generated from 2/5 channels.");
  assert.equal(model.topUpdates[0], "[grants] Added grant notice G-123");
});
