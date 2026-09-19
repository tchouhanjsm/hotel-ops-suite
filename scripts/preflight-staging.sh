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

echo "=== STAGING PREFLIGHT ==="

echo "[1/3] Database migration"
(
  cd "$ROOT/backend"
  DATABASE_URL="$STAGING_DATABASE_URL" \
    .venv/bin/python -m alembic upgrade head
)

echo "[2/3] Staging admin bootstrap"
"$ROOT/backend/.venv/bin/python" \
  "$ROOT/scripts/bootstrap-staging-admin.py"

echo "[3/3] Backend diagnostics"
"$ROOT/backend/.venv/bin/python" "$ROOT/scripts/diagnostics/check_environment.py"
"$ROOT/backend/.venv/bin/python" "$ROOT/scripts/diagnostics/check_database.py"
"$ROOT/backend/.venv/bin/python" "$ROOT/scripts/diagnostics/check_api.py"
"$ROOT/backend/.venv/bin/python" "$ROOT/scripts/diagnostics/check_auth.py"

echo
echo "STAGING PREFLIGHT: PASS"
