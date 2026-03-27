#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?GCP_PROJECT is required}"
: "${GCP_REGION:?GCP_REGION is required}"
: "${WEB_IMAGE:?WEB_IMAGE is required (Artifact Registry image path)}"

SERVICE_NAME="${WEB_SERVICE_NAME:-umbrella-web-staging}"
WEB_PORT="${WEB_PORT:-3000}"
ARTIFACT_MODE="${UMBRELLA_ARTIFACT_STORAGE_MODE:-gcs}"
ARTIFACT_LOCAL_DIR="${UMBRELLA_ARTIFACT_LOCAL_DIR:-/var/lib/umbrella/artifacts}"
ARTIFACT_BUCKET="${UMBRELLA_GCS_ARTIFACT_BUCKET:-}"
ARTIFACT_PREFIX="${UMBRELLA_GCS_ARTIFACT_PREFIX:-artifacts}"

if [[ "${ARTIFACT_MODE}" == "gcs" && -z "${ARTIFACT_BUCKET}" ]]; then
  echo "UMBRELLA_GCS_ARTIFACT_BUCKET is required when UMBRELLA_ARTIFACT_STORAGE_MODE=gcs"
  exit 1
fi

DEPLOY_ARGS=(
  --project="${GCP_PROJECT}"
  --region="${GCP_REGION}"
  --image="${WEB_IMAGE}"
  --platform=managed
  --allow-unauthenticated
  --port="${WEB_PORT}"
  --set-env-vars="NODE_ENV=production,WEB_PORT=${WEB_PORT},UMBRELLA_ARTIFACT_STORAGE_MODE=${ARTIFACT_MODE},UMBRELLA_ARTIFACT_LOCAL_DIR=${ARTIFACT_LOCAL_DIR},UMBRELLA_DATA_DIR=${ARTIFACT_LOCAL_DIR},UMBRELLA_GCS_ARTIFACT_BUCKET=${ARTIFACT_BUCKET},UMBRELLA_GCS_ARTIFACT_PREFIX=${ARTIFACT_PREFIX}"
)

if [[ "${ARTIFACT_MODE}" == "gcs" ]]; then
  DEPLOY_ARGS+=(--add-volume="name=artifacts,type=cloud-storage,bucket=${ARTIFACT_BUCKET}" --add-volume-mount="volume=artifacts,mount-path=${ARTIFACT_LOCAL_DIR}")
fi

gcloud run deploy "${SERVICE_NAME}" "${DEPLOY_ARGS[@]}"
