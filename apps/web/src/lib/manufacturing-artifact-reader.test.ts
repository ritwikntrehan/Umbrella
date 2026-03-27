import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLatestManufacturingEditorialForWeb } from "./manufacturing-artifact-reader.js";

test("manufacturing artifact reader returns fallback when no artifact exists", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "umbrella-web-test-"));
  process.env.UMBRELLA_DATA_DIR = tempDir;

  const model = readLatestManufacturingEditorialForWeb();

  assert.ok(model.fallbackReason);
  assert.equal(model.sourceId, "manufacturing-pilot-network");
});
