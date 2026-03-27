#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_DIR="${ROOT_DIR}/.tmp/staging-smoke-data"
WEB_LOG="${ROOT_DIR}/.tmp/staging-smoke-web.log"
WEB_PORT="${WEB_PORT:-3100}"

mkdir -p "${DATA_DIR}" "${ROOT_DIR}/.tmp"
rm -rf "${DATA_DIR}"/*

export UMBRELLA_DATA_DIR="${DATA_DIR}"

echo "[smoke] generating staged artifacts"
(
  cd "${ROOT_DIR}"
  ./scripts/staging/run-staging-cycle.sh
)

if [[ ! -f "${DATA_DIR}/published/umbrella-synthesis/latest.umbrella-synthesis.json" ]]; then
  echo "[smoke] missing umbrella synthesis artifact"
  exit 1
fi

echo "[smoke] starting web server"
(
  cd "${ROOT_DIR}"
  WEB_PORT="${WEB_PORT}" npm run dev:web >"${WEB_LOG}" 2>&1
) &
WEB_PID=$!
trap 'kill ${WEB_PID} >/dev/null 2>&1 || true' EXIT

for _ in {1..30}; do
  if curl -fsS "http://127.0.0.1:${WEB_PORT}/" >/dev/null; then
    break
  fi
  sleep 1
done

HOME_HTML="$(curl -fsS "http://127.0.0.1:${WEB_PORT}/")"
GRANTS_HTML="$(curl -fsS "http://127.0.0.1:${WEB_PORT}/channels/grants")"

if [[ "${HOME_HTML}" != *"Umbrella Synthesis Layer"* ]]; then
  echo "[smoke] home page did not render synthesis content"
  exit 1
fi

if [[ "${GRANTS_HTML}" != *"Grants"* ]]; then
  echo "[smoke] grants page did not render expected content"
  exit 1
fi

echo "[smoke] passed"
