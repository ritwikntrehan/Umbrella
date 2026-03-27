import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CANONICAL_CHANNEL_SLUGS,
  CORE_CONTRACT_OBJECT_NAMES,
  type ChannelSlug,
  type CoreContractObjectName
} from "@umbrella/core";
import {
  grantsChannelConfig,
  grantsSources,
  mAndAChannelConfig,
  mAndASources,
  manufacturingChannelConfig,
  manufacturingSources,
  marketSignalsChannelConfig,
  marketSignalsSources,
  tradeChannelConfig,
  tradeSources
} from "@umbrella/channel-config";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2)
      ? true
      : false
    : false;

type Expect<T extends true> = T;

type _ChannelSlugContractIsExact = Expect<Equals<ChannelSlug, (typeof CANONICAL_CHANNEL_SLUGS)[number]>>;
type _CoreObjectNameContractIsExact = Expect<Equals<CoreContractObjectName, (typeof CORE_CONTRACT_OBJECT_NAMES)[number]>>;

const channelConfigs = [
  grantsChannelConfig,
  tradeChannelConfig,
  manufacturingChannelConfig,
  marketSignalsChannelConfig,
  mAndAChannelConfig
] as const;

const allSources = [...grantsSources, ...tradeSources, ...manufacturingSources, ...marketSignalsSources, ...mAndASources] as const;

const REPO_ROOT = `${process.cwd()}/../..`;

function readRepoDoc(filename: string): string {
  return readFileSync(`${REPO_ROOT}/${filename}`, "utf8");
}

test("channel-config slugs and source channels are restricted to canonical ChannelSlug values", () => {
  const canonical = new Set<ChannelSlug>(CANONICAL_CHANNEL_SLUGS);

  for (const config of channelConfigs) {
    assert.equal(canonical.has(config.slug), true, `Unexpected channel config slug: ${config.slug}`);
  }

  for (const source of allSources) {
    assert.equal(canonical.has(source.channel), true, `Unexpected source channel: ${source.channel}`);
  }
});

test("CHANNELS.md, SYSTEM_OVERVIEW.md, and BUILD_SEQUENCE.md only reference canonical channel IDs", () => {
  const channelsDoc = readRepoDoc("CHANNELS.md");
  const systemOverviewDoc = readRepoDoc("SYSTEM_OVERVIEW.md");
  const buildSequenceDoc = readRepoDoc("BUILD_SEQUENCE.md");

  for (const channelId of CANONICAL_CHANNEL_SLUGS) {
    assert.match(channelsDoc, new RegExp("`" + channelId + "`"));
    assert.match(systemOverviewDoc, new RegExp("`" + channelId + "`"));
  }

  assert.match(buildSequenceDoc, /`market-signals`, `m-and-a`/);

  assert.doesNotMatch(channelsDoc, /`econ`|`ma`/);
  assert.doesNotMatch(systemOverviewDoc, /`econ`|`ma`/);
  assert.doesNotMatch(buildSequenceDoc, /`econ`|`ma`/);
});

test("DATA_CONTRACTS.md names canonical channels and implemented contract object names", () => {
  const contractsDoc = readRepoDoc("DATA_CONTRACTS.md");

  assert.match(contractsDoc, /`grants \| trade \| manufacturing \| market-signals \| m-and-a`/);

  for (const objectName of CORE_CONTRACT_OBJECT_NAMES) {
    assert.match(contractsDoc, new RegExp("`" + objectName + "`"));
  }

  assert.doesNotMatch(contractsDoc, /`econ`|`ma`/);
});
