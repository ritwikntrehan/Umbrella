import assert from "node:assert/strict";
import test from "node:test";
import { mAndASources } from "@umbrella/channel-config";
import { MockMAndAAdapter } from "@umbrella/source-adapters";
import { runChangeDetection } from "../runners/change-detection-runner.js";
import { runNormalization } from "../runners/normalization-runner.js";

const baseSource = mAndASources[0];

if (!baseSource) {
  throw new Error("Missing M&A source fixture.");
}

test("mock M&A adapter fetch is deterministic for base fixture", async () => {
  const adapter = new MockMAndAAdapter();
  const [first] = await adapter.fetch(baseSource);
  const [second] = await adapter.fetch(baseSource);

  assert.equal(first.checksum, second.checksum);
  assert.equal(first.id, second.id);
  assert.equal(first.metadata?.feedVersion, "v1");
});

test("M&A normalization emits expected record shape", async () => {
  const adapter = new MockMAndAAdapter();
  const rawAssets = await adapter.fetch(baseSource);
  const normalized = await runNormalization(baseSource, rawAssets);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0]?.externalId, "MA-ASSET-310");
  assert.equal(normalized[0]?.payload.sourceId, baseSource.id);
  assert.equal(normalized[0]?.payload.signalType, "asset-move");
});

test("M&A change detection reports no_change for stable input and changed for updated fixture", async () => {
  const adapter = new MockMAndAAdapter();

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
  assert.deepEqual(changed.addedExternalIds, ["MA-OPS-455"]);
  assert.equal(changed.removedExternalIds.length, 0);
});
