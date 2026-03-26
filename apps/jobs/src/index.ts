import { grantsSources } from "@umbrella/channel-config";
import { runChangeDetection } from "./runners/change-detection-runner.js";
import { assembleGrantsBulletinArtifact } from "./runners/grants-bulletin-assembler.js";
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

async function runGrantsBulletinAssembly(): Promise<void> {
  const source = grantsSources[0];
  if (!source) throw new Error("No grants source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const changeEvent = await store.readLatestChangeEvent(source);
  if (!changeEvent) {
    throw new Error("No change event artifact found. Run grants pilot first.");
  }

  const normalizedRecords = await store.readLatestNormalizedRecords(source);
  if (!normalizedRecords) {
    throw new Error("No normalized records artifact found. Run grants pilot first.");
  }

  const bulletin = assembleGrantsBulletinArtifact({
    source,
    changeEvent,
    normalizedRecords
  });

  const artifactPath = await store.writeBulletinReadyArtifact(source, bulletin);

  console.log("[jobs] grants bulletin-ready artifact assembled");
  console.log(`  source=${source.id}`);
  console.log(`  bulletinId=${bulletin.bulletin_id}`);
  console.log(`  period=${bulletin.bulletin_period.label}`);
  console.log(`  generatedAt=${bulletin.generated_at}`);
  console.log(`  status=${changeEvent.status}`);
  console.log(`  topLine=${bulletin.top_line.body}`);
  console.log(`  whatChangedItems=${bulletin.what_changed.items.length}`);
  console.log(`  watchlistItems=${bulletin.watchlist_1_4_weeks?.items.length ?? 0}`);
  console.log(`  artifact=${artifactPath}`);
  console.log(`  dataRoot=${store.rootDir}`);
}

async function inspectLatestGrantsBulletin(): Promise<void> {
  const source = grantsSources[0];
  if (!source) throw new Error("No grants source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const bulletin = await store.readLatestBulletinReadyArtifact(source);
  if (!bulletin) {
    throw new Error("No bulletin-ready artifact found. Run grants bulletin assembly first.");
  }

  console.log("[jobs] latest grants bulletin-ready artifact summary");
  console.log(`  bulletinId=${bulletin.bulletin_id}`);
  console.log(`  period=${bulletin.bulletin_period.label}`);
  console.log(`  generatedAt=${bulletin.generated_at}`);
  console.log(`  topLine=${bulletin.top_line.body}`);
  console.log(`  whatChanged=${bulletin.what_changed.items.join(" | ")}`);
  console.log(`  whyItMatters=${bulletin.why_it_matters.items.join(" | ")}`);
  console.log(`  hasDataSnapshot=${bulletin.data_snapshot !== null}`);
  console.log(`  watchlistCount=${bulletin.watchlist_1_4_weeks?.items.length ?? 0}`);
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

  if (command === "grants-bulletin") {
    await runGrantsBulletinAssembly();
    return;
  }

  if (command === "inspect-grants-bulletin") {
    await inspectLatestGrantsBulletin();
    return;
  }

  throw new Error(
    `Unknown jobs command: ${command}. Use 'source-check', 'grants-pilot', 'grants-bulletin', or 'inspect-grants-bulletin'.`
  );
}

main().catch((error) => {
  console.error("[jobs] pilot pipeline failed", error);
  process.exitCode = 1;
});
