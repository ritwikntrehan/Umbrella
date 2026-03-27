#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?GCP_PROJECT is required}"
: "${GCP_REGION:?GCP_REGION is required}"
: "${SCHEDULER_SA_EMAIL:?SCHEDULER_SA_EMAIL is required}"

JOB_NAME="${JOBS_NAME:-umbrella-jobs-staging}"
SCHEDULER_NAME="${SCHEDULER_NAME:-umbrella-jobs-schedule-staging}"
RUNNER_SCHEDULE="${RUNNER_SCHEDULE:-*/30 * * * *}"

URI="https://${GCP_REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${GCP_PROJECT}/jobs/${JOB_NAME}:run"

if gcloud scheduler jobs describe "${SCHEDULER_NAME}" --project="${GCP_PROJECT}" --location="${GCP_REGION}" >/dev/null 2>&1; then
  gcloud scheduler jobs update http "${SCHEDULER_NAME}" \
    --project="${GCP_PROJECT}" \
    --location="${GCP_REGION}" \
    --schedule="${RUNNER_SCHEDULE}" \
    --uri="${URI}" \
    --http-method=POST \
    --oauth-service-account-email="${SCHEDULER_SA_EMAIL}" \
    --oauth-token-scope="https://www.googleapis.com/auth/cloud-platform"
  echo "updated Cloud Scheduler job: ${SCHEDULER_NAME}"
else
  gcloud scheduler jobs create http "${SCHEDULER_NAME}" \
    --project="${GCP_PROJECT}" \
    --location="${GCP_REGION}" \
    --schedule="${RUNNER_SCHEDULE}" \
    --uri="${URI}" \
    --http-method=POST \
    --oauth-service-account-email="${SCHEDULER_SA_EMAIL}" \
    --oauth-token-scope="https://www.googleapis.com/auth/cloud-platform"
  echo "created Cloud Scheduler job: ${SCHEDULER_NAME}"
fi
