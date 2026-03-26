import { grantsSources } from "@umbrella/channel-config";
import { runChangeDetection } from "./runners/change-detection-runner.js";
import { runIngestion } from "./runners/ingestion-runner.js";
import { runNormalization } from "./runners/normalization-runner.js";
import { runSourceCheck } from "./runners/source-check-runner.js";

async function main(): Promise<void> {
  const source = grantsSources[0];
  if (!source) throw new Error("No grants source configured for pilot scaffold.");

  const check = await runSourceCheck(source);
  const { run, rawAssets } = await runIngestion(source);
  const normalized = await runNormalization(source, rawAssets);
  const fingerprints = runChangeDetection(source, rawAssets);

  console.log("[jobs] source check", check.status, check.fingerprint);
  console.log("[jobs] ingestion run", run.id, `assets=${run.rawAssetCount}`);
  console.log("[jobs] normalized records", normalized.length);
  console.log("[jobs] diff fingerprints", fingerprints);
}

main().catch((error) => {
  console.error("[jobs] scaffold pipeline failed", error);
  process.exitCode = 1;
});
