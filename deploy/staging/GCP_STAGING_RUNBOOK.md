# GCP staging runbook (first bring-up)

This runbook is intentionally short and practical for the first hosted staging cycle.

## 0) Preconditions

- GCP project and region selected
- Cloud Run + Cloud Scheduler + Artifact Registry + Cloud Storage APIs enabled
- Container images built from:
  - `deploy/staging/Dockerfile.web`
  - `deploy/staging/Dockerfile.jobs`
- Staging env values prepared from `deploy/staging/gcp/env.staging.example`

## 1) Initial staging bring-up

1. Create artifact bucket (`gs://<bucket>`).
2. Create service accounts for web/job/scheduler and bind least-privilege IAM.
3. Deploy Cloud Run Job first (`umbrella-jobs-staging`).
4. Deploy Cloud Run service second (`umbrella-web-staging`).

## 2) Deploy web

Deploy Cloud Run service with env vars:

- `UMBRELLA_ARTIFACT_STORAGE_MODE=gcs`
- `UMBRELLA_ARTIFACT_LOCAL_DIR=/var/lib/umbrella/artifacts`
- `UMBRELLA_GCS_ARTIFACT_BUCKET`, `UMBRELLA_GCS_ARTIFACT_PREFIX`
- `WEB_PORT=3000`

If artifacts are not yet present, homepage/channel pages should show fallback guidance.

## 3) Run jobs manually first

Before scheduling, execute the Cloud Run job manually one time.

Expected job behavior:

1. run full channel cycle (`scripts/staging/run-staging-cycle.sh`)
2. generate latest `published/*` artifacts
3. writes artifacts through the Cloud Storage-backed volume mount

## 4) Validate artifact generation

Confirm bucket paths exist:

- `raw/`
- `clean/`
- `features/`
- `published/`
- `published/umbrella-synthesis/latest.umbrella-synthesis.json`

Also spot-check one channel editorial artifact:

- `published/grants/latest.editorial.json`

## 5) Validate homepage rendering

Open web root (`/`) and confirm:

- umbrella synthesis summary block is present
- top updates and notable patterns render

## 6) Validate channel rendering

Open:

- `/channels/grants`
- `/channels/trade`
- `/channels/market-signals`
- `/channels/manufacturing`
- `/channels/m-and-a`

Confirm each page shows latest editorial content (or deterministic fallback if source sparse).

## 7) Enable scheduled runs

After manual validation passes:

1. Create Cloud Scheduler HTTP job to invoke Cloud Run job execution API.
2. Use service-account OAuth call to the Cloud Run Jobs API endpoint.
3. Start with conservative cadence (for example every 30 minutes).
4. Observe two full scheduled cycles before considering this staging loop healthy.

## 8) Failure handling quick actions

- Job fails: disable scheduler, run job manually, inspect Cloud Run logs.
- Web regressions: roll back Cloud Run service traffic to previous revision.
- Bad artifact push: restore prior bucket object version/snapshot and redeploy prior job image if needed.
