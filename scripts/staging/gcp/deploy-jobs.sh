#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?GCP_PROJECT is required}"
: "${GCP_REGION:?GCP_REGION is required}"
: "${JOBS_IMAGE:?JOBS_IMAGE is required (Artifact Registry image path)}"

JOB_NAME="${JOBS_NAME:-umbrella-jobs-staging}"
ARTIFACT_MODE="${UMBRELLA_ARTIFACT_STORAGE_MODE:-gcs}"
ARTIFACT_LOCAL_DIR="${UMBRELLA_ARTIFACT_LOCAL_DIR:-/var/lib/umbrella/artifacts}"
ARTIFACT_BUCKET="${UMBRELLA_GCS_ARTIFACT_BUCKET:-}"
ARTIFACT_PREFIX="${UMBRELLA_GCS_ARTIFACT_PREFIX:-artifacts}"
RUNNER_SCHEDULE="${RUNNER_SCHEDULE:-*/30 * * * *}"

if [[ "${ARTIFACT_MODE}" == "gcs" && -z "${ARTIFACT_BUCKET}" ]]; then
  echo "UMBRELLA_GCS_ARTIFACT_BUCKET is required when UMBRELLA_ARTIFACT_STORAGE_MODE=gcs"
  exit 1
fi

DEPLOY_ARGS=(
  --project="${GCP_PROJECT}"
  --region="${GCP_REGION}"
  --image="${JOBS_IMAGE}"
  --command="./scripts/staging/run-staging-cycle.sh"
  --set-env-vars="NODE_ENV=production,UMBRELLA_ARTIFACT_STORAGE_MODE=${ARTIFACT_MODE},UMBRELLA_ARTIFACT_LOCAL_DIR=${ARTIFACT_LOCAL_DIR},UMBRELLA_DATA_DIR=${ARTIFACT_LOCAL_DIR},UMBRELLA_GCS_ARTIFACT_BUCKET=${ARTIFACT_BUCKET},UMBRELLA_GCS_ARTIFACT_PREFIX=${ARTIFACT_PREFIX},RUNNER_SCHEDULE=${RUNNER_SCHEDULE}"
)

if [[ "${ARTIFACT_MODE}" == "gcs" ]]; then
  DEPLOY_ARGS+=(--add-volume="name=artifacts,type=cloud-storage,bucket=${ARTIFACT_BUCKET}" --add-volume-mount="volume=artifacts,mount-path=${ARTIFACT_LOCAL_DIR}")
fi

gcloud run jobs deploy "${JOB_NAME}" "${DEPLOY_ARGS[@]}"
