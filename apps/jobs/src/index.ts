import { grantsSources } from "@umbrella/channel-config";
import { runChangeDetection } from "./runners/change-detection-runner.js";
import { runIngestion } from "./runners/ingestion-runner.js";
import { runNormalization } from "./runners/normalization-runner.js";
import { runSourceCheck } from "./runners/source-check-runner.js";
import { createLocalArtifactStore } from "./lib/local-artifact-store.js";
import { validateNormalizedRecords, validateRawAssets, validateSourceCheck } from "./lib/validators.js";

async function runSourceCheckOnly(): Promise<void> {
  const source = grantsSources[0];
  if (!source) throw new Error("No grants source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const check = await runSourceCheck(source);
  validateSourceCheck(check);
  const sourceCheckPath = await store.writeSourceCheck(source, check);

  console.log("[jobs] grants source check complete");
  console.log(`  source=${source.id}`);
  console.log(`  status=${check.status}`);
  console.log(`  fingerprint=${check.fingerprint ?? "n/a"}`);
  console.log(`  artifact=${sourceCheckPath}`);
}

async function runGrantsPilotPipeline(): Promise<void> {
  const source = grantsSources[0];
  if (!source) throw new Error("No grants source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();

  const check = await runSourceCheck(source);
  validateSourceCheck(check);
  const sourceCheckPath = await store.writeSourceCheck(source, check);

  const { run, rawAssets } = await runIngestion(source);
  validateRawAssets(rawAssets);
  const ingestionRunPath = await store.writeIngestionRun(source, run);
  const rawAssetsPath = await store.writeRawAssets(source, run.id, rawAssets);

  const normalized = await runNormalization(source, rawAssets);
  validateNormalizedRecords(normalized);
  const normalizedPath = await store.writeNormalizedRecords(source, run.id, normalized);

  const previousEvent = await store.readLatestChangeEvent(source);
  const changeEvent = runChangeDetection(source, normalized, previousEvent);
  const changeEventPath = await store.writeChangeEvent(source, run.id, changeEvent);

  console.log("[jobs] grants pilot deterministic pipeline complete");
  console.log(`  source=${source.id}`);
  console.log(`  runId=${run.id}`);
  console.log(`  sourceCheck.status=${check.status}`);
  console.log(`  rawAssetCount=${rawAssets.length}`);
  console.log(`  normalizedRecordCount=${normalized.length}`);
  console.log(`  changeEvent.status=${changeEvent.status}`);
  console.log(`  artifacts.raw.sourceCheck=${sourceCheckPath}`);
  console.log(`  artifacts.raw.ingestionRun=${ingestionRunPath}`);
  console.log(`  artifacts.raw.rawAssets=${rawAssetsPath}`);
  console.log(`  artifacts.clean.normalized=${normalizedPath}`);
  console.log(`  artifacts.features.changeEvent=${changeEventPath}`);
  console.log(`  dataRoot=${store.rootDir}`);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "grants-pilot";

  if (command === "source-check") {
    await runSourceCheckOnly();
    return;
  }

  if (command === "grants-pilot") {
    await runGrantsPilotPipeline();
    return;
  }

  throw new Error(`Unknown jobs command: ${command}. Use 'source-check' or 'grants-pilot'.`);
}

main().catch((error) => {
  console.error("[jobs] pilot pipeline failed", error);
  process.exitCode = 1;
});
