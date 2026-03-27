#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?GCP_PROJECT is required}"
: "${GCP_REGION:?GCP_REGION is required}"

AR_REPOSITORY="${AR_REPOSITORY:-umbrella-staging}"
IMAGE_TAG="${IMAGE_TAG:-staging-$(date -u +%Y%m%d-%H%M%S)}"
AR_HOST="${GCP_REGION}-docker.pkg.dev"
WEB_IMAGE="${WEB_IMAGE:-${AR_HOST}/${GCP_PROJECT}/${AR_REPOSITORY}/umbrella-web:${IMAGE_TAG}}"
JOBS_IMAGE="${JOBS_IMAGE:-${AR_HOST}/${GCP_PROJECT}/${AR_REPOSITORY}/umbrella-jobs:${IMAGE_TAG}}"


echo "building jobs image: ${JOBS_IMAGE}"
docker build -f deploy/staging/Dockerfile.jobs -t "${JOBS_IMAGE}" .

echo "building web image: ${WEB_IMAGE}"
docker build -f deploy/staging/Dockerfile.web -t "${WEB_IMAGE}" .

echo "pushing jobs image"
docker push "${JOBS_IMAGE}"

echo "pushing web image"
docker push "${WEB_IMAGE}"

echo "WEB_IMAGE=${WEB_IMAGE}"
echo "JOBS_IMAGE=${JOBS_IMAGE}"
