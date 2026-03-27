#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?GCP_PROJECT is required}"
: "${GCP_REGION:?GCP_REGION is required}"

JOB_NAME="${JOBS_NAME:-umbrella-jobs-staging}"

gcloud run jobs execute "${JOB_NAME}" \
  --project="${GCP_PROJECT}" \
  --region="${GCP_REGION}" \
  --wait
