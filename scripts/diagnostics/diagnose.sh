#!/bin/bash
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PYTHON="$ROOT/backend/.venv/bin/python"

if [ ! -x "$PYTHON" ]; then
  echo "[FAIL] Backend Python not found: $PYTHON"
  exit 1
fi

status=0

run_check() {
  echo
  "$PYTHON" "$@" || status=1
}

run_check "$ROOT/scripts/diagnostics/check_environment.py"
run_check "$ROOT/scripts/diagnostics/check_database.py"
run_check "$ROOT/scripts/diagnostics/check_api.py"
run_check "$ROOT/scripts/diagnostics/check_frontend.py"
run_check "$ROOT/scripts/diagnostics/check_auth.py"

echo
if [ "$status" -eq 0 ]; then
  echo "DIAGNOSTICS: PASS"
else
  echo "DIAGNOSTICS: FAIL"
fi

exit "$status"
