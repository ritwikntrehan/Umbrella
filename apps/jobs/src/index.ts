import { grantsSources, tradeSources } from "@umbrella/channel-config";
import { createLocalArtifactStore } from "./lib/local-artifact-store.js";
import { validateNormalizedRecords, validateRawAssets, validateSourceCheck } from "./lib/validators.js";
import { runChangeDetection } from "./runners/change-detection-runner.js";
import { assembleGrantsBulletinArtifact } from "./runners/grants-bulletin-assembler.js";
import { transformGrantsBulletinToEditorial } from "./runners/grants-editorial-transformer.js";
import { runIngestion } from "./runners/ingestion-runner.js";
import { runNormalization } from "./runners/normalization-runner.js";
import { runSourceCheck } from "./runners/source-check-runner.js";
import { assembleTradeBulletinArtifact } from "./runners/trade-bulletin-assembler.js";
import { transformTradeBulletinToEditorial } from "./runners/trade-editorial-transformer.js";

async function runDeterministicPipeline(source = grantsSources[0]): Promise<void> {
  if (!source) throw new Error("No source configured for deterministic pipeline.");

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

  console.log(`[jobs] ${source.channel} deterministic pipeline complete`);
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

async function runSourceCheckOnly(source = grantsSources[0]): Promise<void> {
  if (!source) throw new Error("No source configured for source-check.");

  const store = await createLocalArtifactStore();
  const check = await runSourceCheck(source);
  validateSourceCheck(check);
  const sourceCheckPath = await store.writeSourceCheck(source, check);

  console.log(`[jobs] ${source.channel} source check complete`);
  console.log(`  source=${source.id}`);
  console.log(`  status=${check.status}`);
  console.log(`  fingerprint=${check.fingerprint ?? "n/a"}`);
  console.log(`  artifact=${sourceCheckPath}`);
}

async function runGrantsBulletinAssembly(): Promise<void> {
  const source = grantsSources[0];
  if (!source) throw new Error("No grants source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const changeEvent = await store.readLatestChangeEvent(source);
  if (!changeEvent) throw new Error("No change event artifact found. Run grants pilot first.");

  const normalizedRecords = await store.readLatestNormalizedRecords(source);
  if (!normalizedRecords) throw new Error("No normalized records artifact found. Run grants pilot first.");

  const bulletin = assembleGrantsBulletinArtifact({ source, changeEvent, normalizedRecords });
  const artifactPath = await store.writeBulletinReadyArtifact(source, bulletin);

  console.log("[jobs] grants bulletin-ready artifact assembled");
  console.log(`  source=${source.id}`);
  console.log(`  bulletinId=${bulletin.bulletin_id}`);
  console.log(`  period=${bulletin.bulletin_period.label}`);
  console.log(`  generatedAt=${bulletin.generated_at}`);
  console.log(`  status=${changeEvent.status}`);
  console.log(`  artifact=${artifactPath}`);
  console.log(`  dataRoot=${store.rootDir}`);
}

async function runTradeBulletinAssembly(): Promise<void> {
  const source = tradeSources[0];
  if (!source) throw new Error("No trade source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const changeEvent = await store.readLatestChangeEvent(source);
  if (!changeEvent) throw new Error("No change event artifact found. Run trade pilot first.");

  const normalizedRecords = await store.readLatestNormalizedRecords(source);
  if (!normalizedRecords) throw new Error("No normalized records artifact found. Run trade pilot first.");

  const bulletin = assembleTradeBulletinArtifact({ source, changeEvent, normalizedRecords });
  const artifactPath = await store.writeBulletinReadyArtifact(source, bulletin);

  console.log("[jobs] trade bulletin-ready artifact assembled");
  console.log(`  source=${source.id}`);
  console.log(`  bulletinId=${bulletin.bulletin_id}`);
  console.log(`  period=${bulletin.bulletin_period.label}`);
  console.log(`  generatedAt=${bulletin.generated_at}`);
  console.log(`  status=${changeEvent.status}`);
  console.log(`  artifact=${artifactPath}`);
  console.log(`  dataRoot=${store.rootDir}`);
}

async function runGrantsEditorialAssembly(): Promise<void> {
  const source = grantsSources[0];
  if (!source) throw new Error("No grants source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const bulletin = await store.readLatestBulletinReadyArtifact(source);
  if (!bulletin || bulletin.channel_id !== "grants") {
    throw new Error("No grants bulletin-ready artifact found. Run grants bulletin assembly first.");
  }

  const editorial = transformGrantsBulletinToEditorial({ bulletin });
  const artifactPath = await store.writeEditorialArtifact(source, editorial);

  console.log("[jobs] grants editorial artifact assembled");
  console.log(`  artifact=${artifactPath}`);
}

async function runTradeEditorialAssembly(): Promise<void> {
  const source = tradeSources[0];
  if (!source) throw new Error("No trade source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const bulletin = await store.readLatestBulletinReadyArtifact(source);
  if (!bulletin || bulletin.channel_id !== "trade") {
    throw new Error("No trade bulletin-ready artifact found. Run trade bulletin assembly first.");
  }

  const editorial = transformTradeBulletinToEditorial({ bulletin });
  const artifactPath = await store.writeEditorialArtifact(source, editorial);

  console.log("[jobs] trade editorial artifact assembled");
  console.log(`  artifact=${artifactPath}`);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "grants-pilot";

  if (command === "source-check") return runSourceCheckOnly(grantsSources[0]);
  if (command === "trade-source-check") return runSourceCheckOnly(tradeSources[0]);
  if (command === "grants-pilot") return runDeterministicPipeline(grantsSources[0]);
  if (command === "trade-pilot") return runDeterministicPipeline(tradeSources[0]);
  if (command === "grants-bulletin") return runGrantsBulletinAssembly();
  if (command === "trade-bulletin") return runTradeBulletinAssembly();
  if (command === "grants-editorial") return runGrantsEditorialAssembly();
  if (command === "trade-editorial") return runTradeEditorialAssembly();

  throw new Error(
    "Unknown jobs command. Use source-check/trade-source-check, grants-pilot/trade-pilot, grants-bulletin/trade-bulletin, grants-editorial/trade-editorial."
  );
}

main().catch((error) => {
  console.error("[jobs] pilot pipeline failed", error);
  process.exitCode = 1;
});
