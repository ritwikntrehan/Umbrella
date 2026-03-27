import { readLatestUmbrellaSynthesisArtifact } from "./artifact-reader-shared.js";

export interface UmbrellaSynthesisViewModel {
  umbrellaArtifactId?: string;
  generatedAt?: string;
  includedChannels: string[];
  missingChannels: string[];
  summary: string;
  topUpdates: string[];
  notablePatterns: string[];
  customWorkCta: string;
  fallbackReason?: string;
}

export function readLatestUmbrellaSynthesisForWeb(): UmbrellaSynthesisViewModel {
  const artifact = readLatestUmbrellaSynthesisArtifact();

  if (!artifact) {
    return {
      includedChannels: [],
      missingChannels: ["grants", "trade", "market-signals", "manufacturing", "m-and-a"],
      summary: "Umbrella synthesis is not available yet.",
      topUpdates: [],
      notablePatterns: [],
      customWorkCta:
        "Need a cross-channel view? Generate channel editorials first, then run umbrella synthesis.",
      fallbackReason:
        "No umbrella synthesis artifact found yet. Run `npm run umbrella-synthesis` after generating channel editorial artifacts."
    };
  }

  return {
    umbrellaArtifactId: artifact.umbrella_artifact_id,
    generatedAt: artifact.generated_at,
    includedChannels: artifact.included_channels,
    missingChannels: artifact.missing_channels,
    summary: artifact.short_umbrella_summary,
    topUpdates: artifact.top_updates_across_channels,
    notablePatterns: artifact.notable_patterns,
    customWorkCta: artifact.custom_work_cta
  };
}
