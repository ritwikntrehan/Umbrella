import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ArtifactEnvelope<T> {
  sourceId: string;
  createdAt: string;
  payload: T;
}

export function getDataRootDir(): string {
  return process.env.UMBRELLA_DATA_DIR ?? join(process.cwd(), "data", "grants-pilot");
}

export function parseArtifactEnvelope<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, "utf8");
    const parsed = JSON.parse(content) as ArtifactEnvelope<T>;
    return parsed.payload;
  } catch {
    return null;
  }
}

export function readLatestEditorialArtifact(sourceId: string): any | null {
  const path = join(getDataRootDir(), "published", sourceId, "latest.editorial.json");
  return parseArtifactEnvelope(path);
}

export function readLatestBulletinReadyArtifact(sourceId: string): any | null {
  const path = join(getDataRootDir(), "published", sourceId, "latest.bulletin-ready.json");
  return parseArtifactEnvelope(path);
}

export function readLatestUmbrellaSynthesisArtifact(): any | null {
  const path = join(getDataRootDir(), "published", "umbrella-synthesis", "latest.umbrella-synthesis.json");
  return parseArtifactEnvelope(path);
}
