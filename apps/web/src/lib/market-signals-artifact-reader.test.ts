import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLatestMarketSignalsEditorialForWeb } from "./market-signals-artifact-reader.js";

test("market-signals artifact reader returns fallback when no artifact exists", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "umbrella-web-test-"));
  process.env.UMBRELLA_DATA_DIR = tempDir;

  const model = readLatestMarketSignalsEditorialForWeb();

  assert.ok(model.fallbackReason);
  assert.equal(model.sourceId, "market-signals-pilot-feed");
});
