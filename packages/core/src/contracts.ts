export type ChannelSlug = "grants" | "trade" | "manufacturing" | "market-signals" | "m-and-a";

export interface Source {
  id: string;
  channel: ChannelSlug;
  name: string;
  adapterKey: string;
  url: string;
  cadence: "hourly" | "daily" | "weekly" | "manual";
  enabled: boolean;
  tags?: string[];
  notes?: string;
}

export interface SourceCheck {
  id: string;
  sourceId: string;
  checkedAt: string;
  status: "ok" | "changed" | "error";
  fingerprint?: string;
  summary?: string;
  errorMessage?: string;
}

export interface IngestionRun {
  id: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string;
  status: "queued" | "running" | "success" | "failed";
  rawAssetCount: number;
  errorMessage?: string;
}

export interface RawAsset {
  id: string;
  sourceId: string;
  ingestionRunId: string;
  capturedAt: string;
  checksum: string;
  contentType: "html" | "json" | "pdf" | "xml" | "text" | "other";
  uri: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ChannelConfig {
  slug: ChannelSlug;
  displayName: string;
  description: string;
  owner: string;
  enabled: boolean;
  sourceIds: string[];
  defaultCadence: Source["cadence"];
}
