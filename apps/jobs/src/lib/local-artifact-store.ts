import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { IngestionRun, RawAsset, Source, SourceCheck } from "@umbrella/core";
import type { NormalizedRecord } from "@umbrella/source-adapters";
import type { GrantsChangeEvent } from "../runners/change-detection-runner.js";

interface ArtifactEnvelope<T> {
  sourceId: string;
  createdAt: string;
  payload: T;
}

export interface ArtifactStore {
  rootDir: string;
  writeSourceCheck: (source: Source, check: SourceCheck) => Promise<string>;
  writeIngestionRun: (source: Source, run: IngestionRun) => Promise<string>;
  writeRawAssets: (source: Source, runId: string, assets: RawAsset[]) => Promise<string>;
  writeNormalizedRecords: (source: Source, runId: string, records: NormalizedRecord[]) => Promise<string>;
  writeChangeEvent: (source: Source, runId: string, event: GrantsChangeEvent) => Promise<string>;
  readLatestChangeEvent: (source: Source) => Promise<GrantsChangeEvent | null>;
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
    async readLatestChangeEvent(source) {
      try {
        const path = join(rootDir, DIRECTORY_NAMES.features, source.id, "latest.change-event.json");
        const content = await readFile(path, "utf8");
        const parsed = JSON.parse(content) as ArtifactEnvelope<GrantsChangeEvent>;
        return parsed.payload;
      } catch {
        return null;
      }
    }
  };
}
