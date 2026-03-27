# GCP staging runbook (first real execution)

This runbook is intentionally narrow: **first real staging bring-up for web + jobs only**.

## 0) Preconditions

Already completed (from previous task):

- GCP project exists
- billing is enabled
- Cloud Storage staging bucket exists
- Artifact Registry Docker repository exists
- staging service accounts exist

Required local tooling:

- `gcloud` authenticated to the staging project
- Docker available for image builds

Prepare env file from template:

```bash
cp deploy/staging/gcp/env.staging.example .env.staging
# fill values, then:
set -a; source ./.env.staging; set +a
```

## 1) Manual inputs vs scripted inputs

### Fill manually in GCP console (or one-time CLI if preferred)

- verify APIs are enabled: Cloud Run, Artifact Registry, Cloud Scheduler, Cloud Storage, IAM
- verify bucket exists: `gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}`
- verify service accounts and IAM bindings:
  - `WEB_SA_EMAIL`
  - `JOBS_SA_EMAIL`
  - `SCHEDULER_SA_EMAIL`

### Supplied via env + scripts

- project/region: `GCP_PROJECT`, `GCP_REGION`
- image contract: `AR_REPOSITORY`, `WEB_IMAGE`, `JOBS_IMAGE`
- artifact contract: `UMBRELLA_GCS_ARTIFACT_BUCKET`, `UMBRELLA_GCS_ARTIFACT_PREFIX`, `UMBRELLA_ARTIFACT_LOCAL_DIR`
- runtime metadata: `UMBRELLA_GCP_PROJECT`, `UMBRELLA_GCP_REGION`, `RUNNER_SCHEDULE`

## 2) Bring-up order (do not enable scheduler yet)

1. Build + push images.
2. Deploy Cloud Run Job.
3. Run jobs manually once.
4. Validate artifacts in Cloud Storage.
5. Deploy Cloud Run web service.
6. Validate homepage + channel pages.
7. Run staging smoke check.
8. Only then create/update scheduler.

## 3) Build and push images

```bash
./scripts/staging/gcp/build-and-push-images.sh
```

This prints final `WEB_IMAGE` and `JOBS_IMAGE` values.
If you use custom tags, set them before running:

```bash
export IMAGE_TAG=staging-20260327-01
```

## 4) Deploy jobs first

```bash
./scripts/staging/gcp/deploy-jobs.sh
```

This deploys Cloud Run Job `JOBS_NAME` and wires:

- `UMBRELLA_ARTIFACT_STORAGE_MODE=gcs`
- Cloud Storage volume mount at `UMBRELLA_ARTIFACT_LOCAL_DIR`
- `UMBRELLA_DATA_DIR` alias for current code path compatibility

## 5) Manual job execution before scheduler

```bash
./scripts/staging/gcp/run-jobs-manual.sh
```

Expected output behavior:

- 5 channel cycles run
- umbrella synthesis runs
- artifacts written to staged bucket path

## 6) Validate staged artifacts

Expected paths:

- `gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${UMBRELLA_GCS_ARTIFACT_PREFIX}/raw/`
- `gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${UMBRELLA_GCS_ARTIFACT_PREFIX}/clean/`
- `gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${UMBRELLA_GCS_ARTIFACT_PREFIX}/features/`
- `gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${UMBRELLA_GCS_ARTIFACT_PREFIX}/published/`
- `gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${UMBRELLA_GCS_ARTIFACT_PREFIX}/published/umbrella-synthesis/latest.umbrella-synthesis.json`

Quick checks:

```bash
gcloud storage ls "gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${UMBRELLA_GCS_ARTIFACT_PREFIX}/published/umbrella-synthesis/latest.umbrella-synthesis.json"
gcloud storage ls "gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${UMBRELLA_GCS_ARTIFACT_PREFIX}/published/grants/latest.editorial.json"
```

## 7) Deploy web

```bash
./scripts/staging/gcp/deploy-web.sh
```

Resolve service URL:

```bash
gcloud run services describe "${WEB_SERVICE_NAME}" \
  --project="${GCP_PROJECT}" \
  --region="${GCP_REGION}" \
  --format='value(status.url)'
```

If desired, set `UMBRELLA_WEB_BASE_URL` to that URL for explicit smoke-check targeting.

## 8) Validate staged web

Validate:

- `/` reachable and shows umbrella synthesis layer
- `/channels/grants` reachable and renders staged output
- other channels load (`trade`, `market-signals`, `manufacturing`, `m-and-a`)

Run scripted smoke checks:

```bash
./scripts/staging/gcp/smoke-check-staging.sh
```

## 9) Enable scheduler only after manual validation

When steps 1-8 are clean:

```bash
./scripts/staging/gcp/create-scheduler-job.sh
```

Notes:

- script is idempotent (`create` or `update`)
- start with conservative cadence (`RUNNER_SCHEDULE`)
- observe at least two scheduler-triggered runs before considering staging healthy

## 10) Deferred (intentionally unchanged)

- production deployment and hardening
- Kubernetes/Terraform migration
- new product features (search/auth/archive/publish workflows)
- broad infra rewrite
