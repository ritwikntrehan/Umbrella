import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLatestTradeEditorialForWeb } from "./trade-artifact-reader.js";

test("trade artifact reader returns fallback when no artifact exists", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "umbrella-web-test-"));
  process.env.UMBRELLA_DATA_DIR = tempDir;

  const model = readLatestTradeEditorialForWeb();

  assert.ok(model.fallbackReason);
  assert.equal(model.sourceId, "trade-pilot-bulletins");
});
