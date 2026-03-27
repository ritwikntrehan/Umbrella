# GCP staging deployment plan (Cloud Run-first)

This document defines the **first hosted staging target** for the current Umbrella repository state.

Scope is intentionally narrow:

- staging only
- Cloud Run service + Cloud Run Jobs + Cloud Scheduler + Cloud Storage
- no production hardening and no architecture rewrite

## 1) Runtime mapping from current repo to GCP services

| Repo component | Runtime behavior today | GCP staging target |
| --- | --- | --- |
| `apps/web` | Long-running HTTP server, reads latest published artifacts from `UMBRELLA_DATA_DIR` | **Cloud Run service** (`umbrella-web-staging`) |
| `apps/jobs` | Run-to-completion pipeline commands writing artifacts under `raw/clean/features/published` | **Cloud Run Job** (`umbrella-jobs-staging`) |
| `scripts/staging/run-staging-cycle.sh` | Executes full 5-channel deterministic cycle + umbrella synthesis | **Cloud Run Job command entrypoint** used for manual and scheduled runs |
| Staged artifacts (`data/grants-pilot`) | Local filesystem root for `raw/clean/features/published` | **Cloud Storage bucket** mounted into the runtime local artifact path |
| Scheduled refresh | Manual script execution today | **Cloud Scheduler HTTP trigger** that executes Cloud Run Job |

## 2) Recommended staging architecture

```text
Cloud Scheduler (cron)
   -> Authenticated HTTP call to Cloud Run Jobs API
       -> Cloud Run Job: umbrella-jobs-staging
            - runs scripts/staging/run-staging-cycle.sh
            - writes latest artifacts directly through mounted Cloud Storage path

Cloud Run Service: umbrella-web-staging
   - serves homepage + channel pages from mounted artifact path
```

### Why this is the preferred first staging shape

1. **Matches current process model**: jobs are batch/run-to-completion and web is HTTP request/response.
2. **Minimal repo churn**: preserves local artifact layout and local-first defaults.
3. **Lower operational overhead** than introducing Kubernetes now.
4. **Direct path to first hosted loop**: job run -> artifact persistence -> web rendering.
5. **Keeps deferred items deferred**: no Terraform requirement, no production scaling decisions.

## 3) Required GCP services/APIs

Enable these APIs on the staging project:

- `run.googleapis.com` (Cloud Run services + jobs)
- `artifactregistry.googleapis.com` (container image registry)
- `cloudscheduler.googleapis.com` (scheduled execution)
- `storage.googleapis.com` (artifact bucket)
- `secretmanager.googleapis.com` (runtime secrets references)
- `iam.googleapis.com` (service accounts and IAM bindings)
- `cloudbuild.googleapis.com` (optional image builds via Cloud Build)

## 4) Environment variables and config contract (staging)

### Shared

- `NODE_ENV=production`
- `UMBRELLA_ARTIFACT_STORAGE_MODE=gcs`
- `UMBRELLA_ARTIFACT_LOCAL_DIR=/var/lib/umbrella/artifacts`
- `UMBRELLA_DATA_DIR=/var/lib/umbrella/artifacts` (backward-compatible alias)
- `UMBRELLA_GCS_ARTIFACT_BUCKET=<staging bucket name>`
- `UMBRELLA_GCS_ARTIFACT_PREFIX=artifacts`

### Web service (`apps/web`)

- `WEB_PORT=3000`
- `UMBRELLA_WEB_BASE_URL=https://<cloud-run-web-url>` (for smoke/check docs and downstream links)

### Jobs runtime (`apps/jobs`)

- `RUNNER_SCHEDULE=<cron string>` (metadata + scheduler parity)
- `UMBRELLA_GCP_PROJECT=<project id>`
- `UMBRELLA_GCP_REGION=<region>`

### Secrets/config notes

No secrets are committed in repo. Store sensitive values (if introduced later) in Secret Manager and bind at deploy time.

## 5) Artifact storage strategy in staging

Current code reads/writes a local path root. For first staging:

- keep local artifact path semantics (`raw/clean/features/published`)
- mount Cloud Storage bucket into the same local artifact path used by jobs/web

Recommended mount contract:

- Cloud Run Job deploy includes `--add-volume type=cloud-storage` and a volume mount at `UMBRELLA_ARTIFACT_LOCAL_DIR`
- Cloud Run Service deploy includes the same mount path
- app code continues to read/write local paths while data persists in Cloud Storage

This avoids a broad storage rewrite while preparing for future native object-storage adapters.

## 6) Deployment order (first bring-up)

1. Create staging bucket and IAM service accounts.
2. Build and push `web` + `jobs` container images.
3. Deploy Cloud Run job (`umbrella-jobs-staging`) with staging env vars.
4. Execute job manually once and verify artifacts in the mounted Cloud Storage bucket.
5. Deploy Cloud Run service (`umbrella-web-staging`) with same artifact env vars.
6. Verify homepage and channel pages.
7. Enable Cloud Scheduler trigger to execute the job on cadence.

## 7) Smoke-check flow

1. Run Cloud Run Job manually.
2. Confirm published artifacts in Cloud Storage, especially:
   - `published/umbrella-synthesis/latest.umbrella-synthesis.json`
   - `published/grants/latest.editorial.json` (and other channels)
3. Hit web endpoints:
   - `/`
   - `/channels/grants`
   - `/channels/trade`
   - `/channels/market-signals`
   - `/channels/manufacturing`
   - `/channels/m-and-a`
4. Confirm homepage shows umbrella synthesis and channel pages render latest editorials.

## 8) Rollback / failure handling basics

- Keep previous Cloud Run revision for `umbrella-web-staging`; roll traffic back to prior revision on regressions.
- For jobs, rerun prior image tag manually and re-sync artifacts.
- Preserve bucket artifacts versioning (recommended) to recover prior snapshots.
- If scheduler causes repeated failures, disable scheduler job first, then debug manually.

## 9) Deferred after this prep step

Still deferred by design:

- production environment design (HA, VPC, policy hardening)
- IaC automation (Terraform), unless chosen in a later phase
- native GCS/object-store abstraction in app code
- auth/search/archive/publish workflow work
- LLM-backed synthesis rollout

## 10) Exit criteria for this preparation phase

This prep phase is complete when:

- deployment commands and env contract are documented
- runtime mapping is explicit and repo-grounded
- minimal storage config seam exists without breaking local development
- runbook is sufficient for first staging bring-up and first scheduler-enabled loop
