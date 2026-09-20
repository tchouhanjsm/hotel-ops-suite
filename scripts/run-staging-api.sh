#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.staging.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "[FAIL] Missing $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

case "${STAGING_DATABASE_URL:-}" in
  *"/hotel_ops_staging")
    ;;
  *)
    echo "[FAIL] STAGING_DATABASE_URL must target hotel_ops_staging"
    exit 1
    ;;
esac

: "${STAGING_ADMIN_USERNAME:?Missing STAGING_ADMIN_USERNAME}"
: "${STAGING_ADMIN_PASSWORD:?Missing STAGING_ADMIN_PASSWORD}"

export DATABASE_URL="$STAGING_DATABASE_URL"

cd "$ROOT/backend"

UVICORN_ARGS=(
  -m uvicorn
  app.main:app
  --host 127.0.0.1
  --port 8000
)

if [ "${STAGING_API_RELOAD:-1}" = "1" ]; then
  UVICORN_ARGS+=(--reload)
fi

exec "$ROOT/backend/.venv/bin/python" "${UVICORN_ARGS[@]}"
