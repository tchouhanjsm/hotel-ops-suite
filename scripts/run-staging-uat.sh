#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.staging.local"
API_LOG="$ROOT/.uat-api.log"
FRONTEND_LOG="$ROOT/.uat-frontend.log"

if [ ! -f "$ENV_FILE" ]; then
  echo "[FAIL] Missing $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${STAGING_ADMIN_USERNAME:?Missing STAGING_ADMIN_USERNAME}"
: "${STAGING_ADMIN_PASSWORD:?Missing STAGING_ADMIN_PASSWORD}"

echo "=== STAGING UAT ==="

echo "[1/5] Ensuring staging API ownership"

API_PIDS="$(lsof -tiTCP:8000 -sTCP:LISTEN 2>/dev/null || true)"

kill_process_tree() {
  local pid="$1"
  local child

  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_process_tree "$child"
  done

  kill "$pid" 2>/dev/null || true
}

find_hotel_ops_api_root() {
  local pid="$1"
  local current="$1"
  local parent
  local cmd
  local cwd

  for _ in $(seq 1 10); do
    cmd="$(ps -p "$current" -o command= 2>/dev/null || true)"
    cwd="$(lsof -a -p "$current" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"

    if [[ "$cwd" == "$ROOT/backend" && "$cmd" == *"uvicorn app.main:app"* ]]; then
      pid="$current"
    fi

    parent="$(ps -p "$current" -o ppid= 2>/dev/null | tr -d ' ')"

    if [ -z "$parent" ] || [ "$parent" = "1" ] || [ "$parent" = "$current" ]; then
      break
    fi

    current="$parent"
  done

  echo "$pid"
}

for PID in $API_PIDS; do
  API_ROOT="$(find_hotel_ops_api_root "$PID")"
  API_ROOT_CMD="$(ps -p "$API_ROOT" -o command= 2>/dev/null || true)"
  API_ROOT_CWD="$(lsof -a -p "$API_ROOT" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"

  if [[ "$API_ROOT_CWD" == "$ROOT/backend" && "$API_ROOT_CMD" == *"uvicorn app.main:app"* ]]; then
    echo "[INFO] Stopping existing Hotel-Ops staging API (PID $API_ROOT)"
    kill_process_tree "$API_ROOT"
  else
    CMD="$(ps -p "$PID" -o command= 2>/dev/null || true)"
    echo "[FAIL] Port 8000 is occupied by a non-Hotel-Ops process:"
    echo "$CMD"
    exit 1
  fi
done

sleep 1

echo "[2/5] Starting staging API"

STAGING_API_RELOAD=0 \
  bash "$ROOT/scripts/run-staging-api.sh" >"$API_LOG" 2>&1 &

API_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
    echo "[PASS] staging API started: http://localhost:8000"
    break
  fi

  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "[FAIL] staging API exited"
    tail -40 "$API_LOG"
    exit 1
  fi

  sleep 1
done

if ! curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
  echo "[FAIL] staging API did not become ready"
  tail -40 "$API_LOG"
  exit 1
fi

echo "[3/5] Ensuring frontend"

if curl -fsS http://localhost:5173 >/dev/null 2>&1; then
  echo "[PASS] frontend: http://localhost:5173"
else
  echo "[INFO] frontend not running. Starting Vite..."

  (
    cd "$ROOT/frontend"
    npm run dev -- --host 127.0.0.1 --port 5173 >"$FRONTEND_LOG" 2>&1
  ) &

  for _ in $(seq 1 30); do
    if curl -fsS http://localhost:5173 >/dev/null 2>&1; then
      echo "[PASS] frontend started: http://localhost:5173"
      break
    fi
    sleep 1
  done

  if ! curl -fsS http://localhost:5173 >/dev/null 2>&1; then
    echo "[FAIL] frontend did not become ready"
    tail -40 "$FRONTEND_LOG"
    exit 1
  fi
fi

echo "[4/5] Staging preflight"

bash "$ROOT/scripts/preflight-staging.sh"

echo "[5/5] Running Cypress"

cd "$ROOT"

UAT_SPEC="${UAT_SPEC:-cypress/e2e/*.cy.ts}"

npx cypress run \
  --browser chrome \
  --spec "$UAT_SPEC"
