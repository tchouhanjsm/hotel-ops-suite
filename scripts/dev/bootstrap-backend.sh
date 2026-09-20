#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND="$ROOT/backend"
VENV="$BACKEND/.venv"
PYTHON="$VENV/bin/python"

echo "=== BACKEND BOOTSTRAP ==="

if [[ ! -x "$PYTHON" ]]; then
  PYTHON3="$(command -v python3 || true)"

  if [[ -z "$PYTHON3" ]]; then
    echo "[FAIL] python3 not found."
    exit 1
  fi

  echo "[INFO] Creating backend virtual environment..."
  "$PYTHON3" -m venv "$VENV"

  if [[ ! -x "$PYTHON" ]]; then
    echo "[FAIL] Failed to create $VENV"
    exit 1
  fi
fi

echo "[1/3] Upgrade pip"
"$PYTHON" -m pip install --upgrade pip
if [[ $? -ne 0 ]]; then
  echo "[FAIL] pip upgrade failed."
  exit 1
fi

echo "[2/3] Install backend development dependencies"
"$PYTHON" -m pip install -r "$BACKEND/requirements-dev.txt"
if [[ $? -ne 0 ]]; then
  echo "[FAIL] Backend dependency installation failed."
  exit 1
fi

echo "[3/3] Verify dependency consistency"
"$PYTHON" -m pip check
if [[ $? -ne 0 ]]; then
  echo "[FAIL] pip dependency check failed."
  exit 1
fi

echo
echo "BACKEND BOOTSTRAP: PASS"
echo "Python: $PYTHON"
