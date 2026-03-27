# Staging deployment artifacts

This folder now contains:

- container artifacts for staging (`Dockerfile.web`, `Dockerfile.jobs`)
- legacy minimal Kubernetes manifests (`k8s/`) retained as reference
- **Cloud Run-first GCP staging docs and helpers** under `deploy/staging/gcp` and `scripts/staging/gcp`

For the current narrow phase, use the Cloud Run-first path:

- plan: `deploy/staging/GCP_STAGING_PLAN.md`
- runbook: `deploy/staging/GCP_STAGING_RUNBOOK.md`
- env template: `deploy/staging/gcp/env.staging.example`

## Environment variable contract

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `UMBRELLA_DATA_DIR` | Yes | jobs, web | Local artifact root path used by current readers/writers. |
| `UMBRELLA_ARTIFACT_LOCAL_DIR` | Recommended | jobs, web | Preferred explicit local artifact root (same effective path as `UMBRELLA_DATA_DIR`). |
| `UMBRELLA_ARTIFACT_STORAGE_MODE` | Recommended (`local` default) | jobs, web | Storage target mode metadata (`local`/`gcs`) for staging config alignment. |
| `UMBRELLA_GCS_ARTIFACT_BUCKET` | Required when `...MODE=gcs` | deploy/runtime | Cloud Storage bucket used for staged artifact persistence. |
| `UMBRELLA_GCS_ARTIFACT_PREFIX` | No (default `artifacts`) | deploy/runtime | Prefix inside the bucket for `raw/clean/features/published`. |
| `WEB_PORT` | No (default `3000`) | web | HTTP listener port. |
| `RUNNER_SCHEDULE` | No (default in script) | jobs/scheduler metadata | Cron expression for scheduled jobs execution. |
| `NODE_ENV` | No (`production`) | jobs, web | Runtime mode. |

## Build container images

```bash
docker build -f deploy/staging/Dockerfile.jobs -t umbrella/jobs:staging .
docker build -f deploy/staging/Dockerfile.web -t umbrella/web:staging .
```


When `UMBRELLA_ARTIFACT_STORAGE_MODE=gcs`, the deploy helper scripts configure a Cloud Storage volume mount at `UMBRELLA_ARTIFACT_LOCAL_DIR` so existing local path reads/writes persist to Cloud Storage without code rewrites.

## Cloud Run deployment helpers

```bash
./scripts/staging/gcp/deploy-jobs.sh
./scripts/staging/gcp/deploy-web.sh
./scripts/staging/gcp/run-jobs-manual.sh
./scripts/staging/gcp/create-scheduler-job.sh
```

## Local smoke check

```bash
./scripts/staging/smoke-check.sh
```
