import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { homePage } from "./home.js";

test("home page renders umbrella synthesis fallback when artifact missing", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "umbrella-web-home-"));
  process.env.UMBRELLA_DATA_DIR = tempDir;

  const html = homePage();

  assert.match(html, /Umbrella Synthesis Layer/);
  assert.match(html, /No umbrella synthesis artifact found yet/);
  assert.match(html, /Top updates across channels/);
});
