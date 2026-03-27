import { grantsSources, mAndASources, manufacturingSources, marketSignalsSources, tradeSources } from "@umbrella/channel-config";
import { createLocalArtifactStore } from "./lib/local-artifact-store.js";
import { validateNormalizedRecords, validateRawAssets, validateSourceCheck } from "./lib/validators.js";
import { runChangeDetection } from "./runners/change-detection-runner.js";
import { assembleGrantsBulletinArtifact } from "./runners/grants-bulletin-assembler.js";
import { transformGrantsBulletinToEditorial } from "./runners/grants-editorial-transformer.js";
import { runIngestion } from "./runners/ingestion-runner.js";
import { assembleMarketSignalsBulletinArtifact } from "./runners/market-signals-bulletin-assembler.js";
import { transformMarketSignalsBulletinToEditorial } from "./runners/market-signals-editorial-transformer.js";
import { assembleManufacturingBulletinArtifact } from "./runners/manufacturing-bulletin-assembler.js";
import { transformManufacturingBulletinToEditorial } from "./runners/manufacturing-editorial-transformer.js";
import { assembleMAndABulletinArtifact } from "./runners/m-and-a-bulletin-assembler.js";
import { transformMAndABulletinToEditorial } from "./runners/m-and-a-editorial-transformer.js";
import { runNormalization } from "./runners/normalization-runner.js";
import { runSourceCheck } from "./runners/source-check-runner.js";
import { assembleTradeBulletinArtifact } from "./runners/trade-bulletin-assembler.js";
import { transformTradeBulletinToEditorial } from "./runners/trade-editorial-transformer.js";
import { assembleUmbrellaSynthesisArtifact } from "./runners/umbrella-synthesis-assembler.js";
import { readUmbrellaSynthesisInput } from "./runners/umbrella-synthesis-input-reader.js";

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

async function runMarketSignalsBulletinAssembly(): Promise<void> {
  const source = marketSignalsSources[0];
  if (!source) throw new Error("No market-signals source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const changeEvent = await store.readLatestChangeEvent(source);
  if (!changeEvent) throw new Error("No change event artifact found. Run market-signals pilot first.");

  const normalizedRecords = await store.readLatestNormalizedRecords(source);
  if (!normalizedRecords) throw new Error("No normalized records artifact found. Run market-signals pilot first.");

  const bulletin = assembleMarketSignalsBulletinArtifact({ source, changeEvent, normalizedRecords });
  const artifactPath = await store.writeBulletinReadyArtifact(source, bulletin);

  console.log("[jobs] market-signals bulletin-ready artifact assembled");
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

async function runMarketSignalsEditorialAssembly(): Promise<void> {
  const source = marketSignalsSources[0];
  if (!source) throw new Error("No market-signals source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const bulletin = await store.readLatestBulletinReadyArtifact(source);
  if (!bulletin || bulletin.channel_id !== "market-signals") {
    throw new Error("No market-signals bulletin-ready artifact found. Run market-signals bulletin assembly first.");
  }

  const editorial = transformMarketSignalsBulletinToEditorial({ bulletin });
  const artifactPath = await store.writeEditorialArtifact(source, editorial);

  console.log("[jobs] market-signals editorial artifact assembled");
  console.log(`  artifact=${artifactPath}`);
}

async function runManufacturingBulletinAssembly(): Promise<void> {
  const source = manufacturingSources[0];
  if (!source) throw new Error("No manufacturing source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const changeEvent = await store.readLatestChangeEvent(source);
  if (!changeEvent) throw new Error("No change event artifact found. Run manufacturing pilot first.");

  const normalizedRecords = await store.readLatestNormalizedRecords(source);
  if (!normalizedRecords) throw new Error("No normalized records artifact found. Run manufacturing pilot first.");

  const bulletin = assembleManufacturingBulletinArtifact({ source, changeEvent, normalizedRecords });
  const artifactPath = await store.writeBulletinReadyArtifact(source, bulletin);

  console.log("[jobs] manufacturing bulletin-ready artifact assembled");
  console.log(`  source=${source.id}`);
  console.log(`  bulletinId=${bulletin.bulletin_id}`);
  console.log(`  period=${bulletin.bulletin_period.label}`);
  console.log(`  generatedAt=${bulletin.generated_at}`);
  console.log(`  status=${changeEvent.status}`);
  console.log(`  artifact=${artifactPath}`);
  console.log(`  dataRoot=${store.rootDir}`);
}


async function runMAndABulletinAssembly(): Promise<void> {
  const source = mAndASources[0];
  if (!source) throw new Error("No M&A source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const changeEvent = await store.readLatestChangeEvent(source);
  if (!changeEvent) throw new Error("No change event artifact found. Run M&A pilot first.");

  const normalizedRecords = await store.readLatestNormalizedRecords(source);
  if (!normalizedRecords) throw new Error("No normalized records artifact found. Run M&A pilot first.");

  const bulletin = assembleMAndABulletinArtifact({ source, changeEvent, normalizedRecords });
  const artifactPath = await store.writeBulletinReadyArtifact(source, bulletin);

  console.log("[jobs] M&A bulletin-ready artifact assembled");
  console.log(`  source=${source.id}`);
  console.log(`  bulletinId=${bulletin.bulletin_id}`);
  console.log(`  period=${bulletin.bulletin_period.label}`);
  console.log(`  generatedAt=${bulletin.generated_at}`);
  console.log(`  status=${changeEvent.status}`);
  console.log(`  artifact=${artifactPath}`);
  console.log(`  dataRoot=${store.rootDir}`);
}

async function runMAndAEditorialAssembly(): Promise<void> {
  const source = mAndASources[0];
  if (!source) throw new Error("No M&A source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const bulletin = await store.readLatestBulletinReadyArtifact(source);
  if (!bulletin || bulletin.channel_id !== "m-and-a") {
    throw new Error("No M&A bulletin-ready artifact found. Run M&A bulletin assembly first.");
  }

  const editorial = transformMAndABulletinToEditorial({ bulletin });
  const artifactPath = await store.writeEditorialArtifact(source, editorial);

  console.log("[jobs] M&A editorial artifact assembled");
  console.log(`  artifact=${artifactPath}`);
}

async function runManufacturingEditorialAssembly(): Promise<void> {
  const source = manufacturingSources[0];
  if (!source) throw new Error("No manufacturing source configured for pilot scaffold.");

  const store = await createLocalArtifactStore();
  const bulletin = await store.readLatestBulletinReadyArtifact(source);
  if (!bulletin || bulletin.channel_id !== "manufacturing") {
    throw new Error("No manufacturing bulletin-ready artifact found. Run manufacturing bulletin assembly first.");
  }

  const editorial = transformManufacturingBulletinToEditorial({ bulletin });
  const artifactPath = await store.writeEditorialArtifact(source, editorial);

  console.log("[jobs] manufacturing editorial artifact assembled");
  console.log(`  artifact=${artifactPath}`);
}

async function runUmbrellaSynthesisAssembly(): Promise<void> {
  const store = await createLocalArtifactStore();
  const input = await readUmbrellaSynthesisInput(store);
  const artifact = assembleUmbrellaSynthesisArtifact({ input });
  const artifactPath = await store.writeUmbrellaSynthesisArtifact(artifact);

  console.log("[jobs] umbrella synthesis artifact assembled");
  console.log(`  umbrellaArtifactId=${artifact.umbrella_artifact_id}`);
  console.log(`  generatedAt=${artifact.generated_at}`);
  console.log(`  includedChannels=${artifact.included_channels.join(", ") || "none"}`);
  console.log(`  missingChannels=${artifact.missing_channels.join(", ") || "none"}`);
  console.log(`  artifact=${artifactPath}`);
  console.log(`  dataRoot=${store.rootDir}`);
}

async function inspectUmbrellaSynthesis(): Promise<void> {
  const store = await createLocalArtifactStore();
  const artifact = await store.readLatestUmbrellaSynthesisArtifact();
  if (!artifact) {
    throw new Error("No umbrella synthesis artifact found. Run umbrella-synthesis first.");
  }

  console.log("[jobs] latest umbrella synthesis artifact");
  console.log(JSON.stringify(artifact, null, 2));
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "grants-pilot";

  if (command === "source-check") return runSourceCheckOnly(grantsSources[0]);
  if (command === "trade-source-check") return runSourceCheckOnly(tradeSources[0]);
  if (command === "market-signals-source-check") return runSourceCheckOnly(marketSignalsSources[0]);
  if (command === "manufacturing-source-check") return runSourceCheckOnly(manufacturingSources[0]);
  if (command === "m-and-a-source-check") return runSourceCheckOnly(mAndASources[0]);
  if (command === "grants-pilot") return runDeterministicPipeline(grantsSources[0]);
  if (command === "trade-pilot") return runDeterministicPipeline(tradeSources[0]);
  if (command === "market-signals-pilot") return runDeterministicPipeline(marketSignalsSources[0]);
  if (command === "manufacturing-pilot") return runDeterministicPipeline(manufacturingSources[0]);
  if (command === "m-and-a-pilot") return runDeterministicPipeline(mAndASources[0]);
  if (command === "grants-bulletin") return runGrantsBulletinAssembly();
  if (command === "trade-bulletin") return runTradeBulletinAssembly();
  if (command === "market-signals-bulletin") return runMarketSignalsBulletinAssembly();
  if (command === "manufacturing-bulletin") return runManufacturingBulletinAssembly();
  if (command === "m-and-a-bulletin") return runMAndABulletinAssembly();
  if (command === "grants-editorial") return runGrantsEditorialAssembly();
  if (command === "trade-editorial") return runTradeEditorialAssembly();
  if (command === "market-signals-editorial") return runMarketSignalsEditorialAssembly();
  if (command === "manufacturing-editorial") return runManufacturingEditorialAssembly();
  if (command === "m-and-a-editorial") return runMAndAEditorialAssembly();
  if (command === "umbrella-synthesis") return runUmbrellaSynthesisAssembly();
  if (command === "inspect-umbrella-synthesis") return inspectUmbrellaSynthesis();

  throw new Error(
    "Unknown jobs command. Use source-check/trade-source-check/market-signals-source-check/manufacturing-source-check/m-and-a-source-check, grants-pilot/trade-pilot/market-signals-pilot/manufacturing-pilot/m-and-a-pilot, grants-bulletin/trade-bulletin/market-signals-bulletin/manufacturing-bulletin/m-and-a-bulletin, grants-editorial/trade-editorial/market-signals-editorial/manufacturing-editorial/m-and-a-editorial, umbrella-synthesis/inspect-umbrella-synthesis."
  );
}

main().catch((error) => {
  console.error("[jobs] pilot pipeline failed", error);
  process.exitCode = 1;
});
