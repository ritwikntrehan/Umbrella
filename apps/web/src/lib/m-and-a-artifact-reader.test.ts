import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLatestMAndAEditorialForWeb } from "./m-and-a-artifact-reader.js";

test("M&A artifact reader returns fallback when no artifact exists", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "umbrella-web-test-"));
  process.env.UMBRELLA_DATA_DIR = tempDir;

  const model = readLatestMAndAEditorialForWeb();

  assert.ok(model.fallbackReason);
  assert.equal(model.sourceId, "m-and-a-pilot-briefings");
});
