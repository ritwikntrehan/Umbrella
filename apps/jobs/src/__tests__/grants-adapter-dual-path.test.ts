import assert from "node:assert/strict";
import test from "node:test";
import type { Source } from "@umbrella/core";
import { GrantsGovAdapter, MockGrantsAdapter } from "@umbrella/source-adapters";
import { runNormalization } from "../runners/normalization-runner.js";

const mockSource: Source = {
  id: "grants-fed-notices",
  channel: "grants",
  name: "Federal Grants Notices (Mock)",
  adapterKey: "mock-grants-feed",
  url: "https://example.org/grants/notices",
  cadence: "daily",
  enabled: true
};

const realFixtureSource: Source = {
  id: "grants-gov-opportunities",
  channel: "grants",
  name: "Grants.gov Opportunities API",
  adapterKey: "grants-gov-feed",
  url: "https://api.grants.gov/v1/api/search2?fixture=base",
  cadence: "daily",
  enabled: true
};

test("dual-path harness: mock and production grants adapters align on normalized baseline fields", async () => {
  const mockAdapter = new MockGrantsAdapter();
  const realAdapter = new GrantsGovAdapter();

  const mockRaw = await mockAdapter.fetch(mockSource);
  const realRaw = await realAdapter.fetch(realFixtureSource);

  const mockNormalized = await runNormalization(mockSource, mockRaw);
  const realNormalized = await runNormalization(realFixtureSource, realRaw);

  assert.equal(mockNormalized.length, 1);
  assert.equal(realNormalized.length, 1);
  assert.equal(realNormalized[0]?.externalId, mockNormalized[0]?.externalId);
  assert.equal(realNormalized[0]?.title, mockNormalized[0]?.title);
  assert.equal(realNormalized[0]?.publishedAt, mockNormalized[0]?.publishedAt);
});

test("production grants adapter normalizes edge-case records deterministically", async () => {
  const adapter = new GrantsGovAdapter();
  const source: Source = {
    ...realFixtureSource,
    url: "https://api.grants.gov/v1/api/search2?fixture=edge"
  };

  const rawAssets = await adapter.fetch(source);
  const normalized = await runNormalization(source, rawAssets);
  const normalizedSecondPass = await runNormalization(source, rawAssets);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0]?.externalId, "EDGE-001");
  assert.equal(normalized[0]?.title, "Precision Manufacturing Transition Grant");
  assert.equal(normalized[0]?.summary?.includes("deterministic dedupe"), true);
  assert.equal(normalized[0]?.payload.agency, "Department of Commerce");
  assert.equal(normalized[0]?.payload.dueDate, "2026-04-30");
  assert.deepEqual(normalized, normalizedSecondPass);
});
