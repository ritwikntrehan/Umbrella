import { join } from "node:path";

export type ArtifactStorageMode = "local" | "gcs";

export interface ArtifactStorageConfig {
  mode: ArtifactStorageMode;
  localDataDir: string;
  gcsBucket?: string;
  gcsPrefix?: string;
}

export function resolveLocalArtifactDataDir(): string {
  return process.env.UMBRELLA_DATA_DIR ?? process.env.UMBRELLA_ARTIFACT_LOCAL_DIR ?? join(process.cwd(), "data", "grants-pilot");
}

export function resolveArtifactStorageConfig(): ArtifactStorageConfig {
  const mode = (process.env.UMBRELLA_ARTIFACT_STORAGE_MODE as ArtifactStorageMode | undefined) ?? "local";
  const localDataDir = resolveLocalArtifactDataDir();

  if (mode === "gcs") {
    return {
      mode,
      localDataDir,
      gcsBucket: process.env.UMBRELLA_GCS_ARTIFACT_BUCKET,
      gcsPrefix: process.env.UMBRELLA_GCS_ARTIFACT_PREFIX
    };
  }

  return { mode: "local", localDataDir };
}
