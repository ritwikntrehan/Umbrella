import assert from "node:assert/strict";
import test from "node:test";
import { grantsSources } from "@umbrella/channel-config";
import { MockGrantsAdapter } from "@umbrella/source-adapters";
import { runChangeDetection } from "../runners/change-detection-runner.js";
import { runNormalization } from "../runners/normalization-runner.js";

const baseSource = grantsSources[0];

if (!baseSource) {
  throw new Error("Missing grants source fixture.");
}

test("mock grants adapter fetch is deterministic for base fixture", async () => {
  const adapter = new MockGrantsAdapter();
  const [first] = await adapter.fetch(baseSource);
  const [second] = await adapter.fetch(baseSource);

  assert.equal(first.checksum, second.checksum);
  assert.equal(first.id, second.id);
  assert.equal(first.metadata?.feedVersion, "v1");
});

test("normalization emits grants-shaped records", async () => {
  const adapter = new MockGrantsAdapter();
  const rawAssets = await adapter.fetch(baseSource);
  const normalized = await runNormalization(baseSource, rawAssets);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0]?.externalId, "DOE-001");
  assert.equal(normalized[0]?.payload.sourceId, baseSource.id);
  assert.ok(normalized[0]?.payload.amountUsd);
});

test("change detection reports no_change for stable input and changed for updated fixture", async () => {
  const adapter = new MockGrantsAdapter();

  const stableRaw = await adapter.fetch(baseSource);
  const stableNormalized = await runNormalization(baseSource, stableRaw);

  const initial = runChangeDetection(baseSource, stableNormalized, null);
  const stableNext = runChangeDetection(baseSource, stableNormalized, initial);

  assert.equal(initial.status, "initial");
  assert.equal(stableNext.status, "no_change");

  const changedSource = { ...baseSource, url: `${baseSource.url}?variant=changed` };
  const changedRaw = await adapter.fetch(changedSource);
  const changedNormalized = await runNormalization(changedSource, changedRaw);
  const changed = runChangeDetection(changedSource, changedNormalized, stableNext);

  assert.equal(changed.status, "changed");
  assert.deepEqual(changed.addedExternalIds, ["USDA-010"]);
  assert.equal(changed.removedExternalIds.length, 0);
});
