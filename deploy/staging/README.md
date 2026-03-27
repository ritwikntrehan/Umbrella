# Staging deployment artifacts

This folder contains minimal Kubernetes + container artifacts for staging.

## Environment variable contract

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `UMBRELLA_DATA_DIR` | Yes | jobs, web | Shared mounted path for generated artifacts (persistent volume target). |
| `WEB_PORT` | No (default `3000`) | web | HTTP listener port. |
| `RUNNER_SCHEDULE` | No (default in manifest) | ops metadata | Cron expression for scheduled jobs execution. |
| `NODE_ENV` | No (`production`) | jobs, web | Runtime mode. |

## Persistent artifact target

Staging replaces container-local filesystem writes with a shared persistent volume mounted at:

- `/var/lib/umbrella/artifacts`

`UMBRELLA_DATA_DIR` points to that mount in both jobs and web containers.

## Build and push images

```bash
docker build -f deploy/staging/Dockerfile.jobs -t umbrella/jobs:staging .
docker build -f deploy/staging/Dockerfile.web -t umbrella/web:staging .
```

## Deploy manifests

```bash
kubectl apply -f deploy/staging/k8s
```

## Smoke check

```bash
./scripts/staging/smoke-check.sh
```
