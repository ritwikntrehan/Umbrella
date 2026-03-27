#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?GCP_PROJECT is required}"
: "${GCP_REGION:?GCP_REGION is required}"
: "${UMBRELLA_GCS_ARTIFACT_BUCKET:?UMBRELLA_GCS_ARTIFACT_BUCKET is required}"

WEB_SERVICE_NAME="${WEB_SERVICE_NAME:-umbrella-web-staging}"
ARTIFACT_PREFIX="${UMBRELLA_GCS_ARTIFACT_PREFIX:-artifacts}"
WEB_URL="${UMBRELLA_WEB_BASE_URL:-}"

if [[ -z "${WEB_URL}" ]]; then
  WEB_URL="$(gcloud run services describe "${WEB_SERVICE_NAME}" --project="${GCP_PROJECT}" --region="${GCP_REGION}" --format='value(status.url)')"
fi

if [[ -z "${WEB_URL}" ]]; then
  echo "unable to resolve web URL"
  exit 1
fi

if [[ -n "${ARTIFACT_PREFIX}" ]]; then
  PREFIX_PATH="${ARTIFACT_PREFIX%/}/"
else
  PREFIX_PATH=""
fi

echo "[smoke] checking web root: ${WEB_URL}/"
HOME_HTML="$(curl -fsS "${WEB_URL}/")"
if [[ "${HOME_HTML}" != *"Umbrella Synthesis Layer"* ]]; then
  echo "[smoke] home page did not render synthesis content"
  exit 1
fi

echo "[smoke] checking grants channel: ${WEB_URL}/channels/grants"
GRANTS_HTML="$(curl -fsS "${WEB_URL}/channels/grants")"
if [[ "${GRANTS_HTML}" != *"Grants"* ]]; then
  echo "[smoke] grants page did not render expected content"
  exit 1
fi

echo "[smoke] checking umbrella synthesis artifact in Cloud Storage"
if ! gcloud storage ls "gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${PREFIX_PATH}published/umbrella-synthesis/latest.umbrella-synthesis.json" >/dev/null 2>&1; then
  echo "[smoke] missing umbrella synthesis artifact"
  exit 1
fi

echo "[smoke] checking channel editorial artifact in Cloud Storage"
if ! gcloud storage ls "gs://${UMBRELLA_GCS_ARTIFACT_BUCKET}/${PREFIX_PATH}published/grants/latest.editorial.json" >/dev/null 2>&1; then
  echo "[smoke] missing grants editorial artifact"
  exit 1
fi

echo "[smoke] passed"
