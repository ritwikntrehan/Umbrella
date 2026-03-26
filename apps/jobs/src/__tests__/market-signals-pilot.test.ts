import assert from "node:assert/strict";
import test from "node:test";
import { marketSignalsSources } from "@umbrella/channel-config";
import { MockMarketSignalsAdapter } from "@umbrella/source-adapters";
import { runChangeDetection } from "../runners/change-detection-runner.js";
import { runNormalization } from "../runners/normalization-runner.js";

const baseSource = marketSignalsSources[0];

if (!baseSource) {
  throw new Error("Missing market-signals source fixture.");
}

test("mock market-signals adapter fetch is deterministic for base fixture", async () => {
  const adapter = new MockMarketSignalsAdapter();
  const [first] = await adapter.fetch(baseSource);
  const [second] = await adapter.fetch(baseSource);

  assert.equal(first.checksum, second.checksum);
  assert.equal(first.id, second.id);
  assert.equal(first.metadata?.feedVersion, "v1");
});

test("market-signals normalization emits expected record shape", async () => {
  const adapter = new MockMarketSignalsAdapter();
  const rawAssets = await adapter.fetch(baseSource);
  const normalized = await runNormalization(baseSource, rawAssets);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0]?.externalId, "MS-ENERGY-001");
  assert.equal(normalized[0]?.payload.sourceId, baseSource.id);
  assert.equal(normalized[0]?.payload.signalType, "pricing");
});

test("market-signals change detection reports no_change for stable input and changed for updated fixture", async () => {
  const adapter = new MockMarketSignalsAdapter();

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
  assert.deepEqual(changed.addedExternalIds, ["MS-FREIGHT-014"]);
  assert.equal(changed.removedExternalIds.length, 0);
});
