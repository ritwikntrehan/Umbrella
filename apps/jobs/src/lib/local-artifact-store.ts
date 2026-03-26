import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { IngestionRun, RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { DeterministicChangeEvent } from "../runners/change-detection-runner.js";
import type { GrantsBulletinReadyArtifact } from "../runners/grants-bulletin-assembler.js";
import type { GrantsEditorialArtifact } from "../runners/grants-editorial-transformer.js";
import type { TradeBulletinReadyArtifact } from "../runners/trade-bulletin-assembler.js";
import type { TradeEditorialArtifact } from "../runners/trade-editorial-transformer.js";
import type { MarketSignalsBulletinReadyArtifact } from "../runners/market-signals-bulletin-assembler.js";
import type { MarketSignalsEditorialArtifact } from "../runners/market-signals-editorial-transformer.js";

interface ArtifactEnvelope<T> {
  sourceId: string;
  createdAt: string;
  payload: T;
}

export type BulletinReadyArtifact =
  | GrantsBulletinReadyArtifact
  | TradeBulletinReadyArtifact
  | MarketSignalsBulletinReadyArtifact;
export type EditorialArtifact = GrantsEditorialArtifact | TradeEditorialArtifact | MarketSignalsEditorialArtifact;

export interface ArtifactStore {
  rootDir: string;
  writeSourceCheck: (source: Source, check: SourceCheck) => Promise<string>;
  writeIngestionRun: (source: Source, run: IngestionRun) => Promise<string>;
  writeRawAssets: (source: Source, runId: string, assets: RawAsset[]) => Promise<string>;
  writeNormalizedRecords: (source: Source, runId: string, records: NormalizedRecord[]) => Promise<string>;
  writeChangeEvent: (source: Source, runId: string, event: DeterministicChangeEvent) => Promise<string>;
  writeBulletinReadyArtifact: (source: Source, artifact: BulletinReadyArtifact) => Promise<string>;
  writeEditorialArtifact: (source: Source, artifact: EditorialArtifact) => Promise<string>;
  readLatestChangeEvent: (source: Source) => Promise<DeterministicChangeEvent | null>;
  readLatestNormalizedRecords: (source: Source) => Promise<NormalizedRecord[] | null>;
  readLatestBulletinReadyArtifact: (source: Source) => Promise<BulletinReadyArtifact | null>;
  readLatestEditorialArtifact: (source: Source) => Promise<EditorialArtifact | null>;
}

const DIRECTORY_NAMES = {
  raw: "raw",
  clean: "clean",
  features: "features",
  published: "published"
} as const;

async function writeJson<T>(path: string, payload: ArtifactEnvelope<T>): Promise<string> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2), "utf8");
  return path;
}

async function readLatestBySuffix<T>(directoryPath: string, suffix: string): Promise<T | null> {
  try {
    const files = (await readdir(directoryPath)).filter((entry) => entry.endsWith(suffix)).sort();
    const latest = files[files.length - 1];
    if (!latest) {
      return null;
    }

    const content = await readFile(join(directoryPath, latest), "utf8");
    const parsed = JSON.parse(content) as ArtifactEnvelope<T>;
    return parsed.payload;
  } catch {
    return null;
  }
}

function getDataRootDir(): string {
  return process.env.UMBRELLA_DATA_DIR ?? join(process.cwd(), "data", "grants-pilot");
}

export async function createLocalArtifactStore(): Promise<ArtifactStore> {
  const rootDir = getDataRootDir();

  await Promise.all(
    Object.values(DIRECTORY_NAMES).map((directoryName) => mkdir(join(rootDir, directoryName), { recursive: true }))
  );

  return {
    rootDir,
    async writeSourceCheck(source, check) {
      const path = join(rootDir, DIRECTORY_NAMES.raw, source.id, "source-check.json");
      return writeJson(path, { sourceId: source.id, createdAt: new Date().toISOString(), payload: check });
    },
    async writeIngestionRun(source, run) {
      const path = join(rootDir, DIRECTORY_NAMES.raw, source.id, `${run.id}.ingestion-run.json`);
      return writeJson(path, { sourceId: source.id, createdAt: new Date().toISOString(), payload: run });
    },
    async writeRawAssets(source, runId, assets) {
      const path = join(rootDir, DIRECTORY_NAMES.raw, source.id, `${runId}.raw-assets.json`);
      return writeJson(path, { sourceId: source.id, createdAt: new Date().toISOString(), payload: assets });
    },
    async writeNormalizedRecords(source, runId, records) {
      const path = join(rootDir, DIRECTORY_NAMES.clean, source.id, `${runId}.normalized-records.json`);
      return writeJson(path, { sourceId: source.id, createdAt: new Date().toISOString(), payload: records });
    },
    async writeChangeEvent(source, runId, event) {
      const runPath = join(rootDir, DIRECTORY_NAMES.features, source.id, `${runId}.change-event.json`);
      await writeJson(runPath, { sourceId: source.id, createdAt: new Date().toISOString(), payload: event });
      const latestPath = join(rootDir, DIRECTORY_NAMES.features, source.id, "latest.change-event.json");
      return writeJson(latestPath, { sourceId: source.id, createdAt: new Date().toISOString(), payload: event });
    },
    async writeBulletinReadyArtifact(source, artifact) {
      const sourcePublishedDir = join(rootDir, DIRECTORY_NAMES.published, source.id);
      const runPath = join(sourcePublishedDir, `${artifact.bulletin_id}.bulletin-ready.json`);
      await writeJson(runPath, { sourceId: source.id, createdAt: artifact.generated_at, payload: artifact });
      const latestPath = join(sourcePublishedDir, "latest.bulletin-ready.json");
      return writeJson(latestPath, { sourceId: source.id, createdAt: artifact.generated_at, payload: artifact });
    },
    async writeEditorialArtifact(source, artifact) {
      const sourcePublishedDir = join(rootDir, DIRECTORY_NAMES.published, source.id);
      const runPath = join(sourcePublishedDir, `${artifact.bulletin_id}.editorial.json`);
      await writeJson(runPath, { sourceId: source.id, createdAt: artifact.generated_at, payload: artifact });
      const latestPath = join(sourcePublishedDir, "latest.editorial.json");
      return writeJson(latestPath, { sourceId: source.id, createdAt: artifact.generated_at, payload: artifact });
    },
    async readLatestChangeEvent(source) {
      try {
        const path = join(rootDir, DIRECTORY_NAMES.features, source.id, "latest.change-event.json");
        const content = await readFile(path, "utf8");
        const parsed = JSON.parse(content) as ArtifactEnvelope<DeterministicChangeEvent>;
        return parsed.payload;
      } catch {
        return null;
      }
    },
    async readLatestNormalizedRecords(source) {
      return readLatestBySuffix<NormalizedRecord[]>(join(rootDir, DIRECTORY_NAMES.clean, source.id), ".normalized-records.json");
    },
    async readLatestBulletinReadyArtifact(source) {
      try {
        const path = join(rootDir, DIRECTORY_NAMES.published, source.id, "latest.bulletin-ready.json");
        const content = await readFile(path, "utf8");
        const parsed = JSON.parse(content) as ArtifactEnvelope<BulletinReadyArtifact>;
        return parsed.payload;
      } catch {
        return null;
      }
    },
    async readLatestEditorialArtifact(source) {
      try {
        const path = join(rootDir, DIRECTORY_NAMES.published, source.id, "latest.editorial.json");
        const content = await readFile(path, "utf8");
        const parsed = JSON.parse(content) as ArtifactEnvelope<EditorialArtifact>;
        return parsed.payload;
      } catch {
        return null;
      }
    }
  };
}
