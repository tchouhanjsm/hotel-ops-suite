#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PYTHON="$ROOT/backend/.venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "ERROR: canonical backend Python environment not found:"
  echo "  $PYTHON"
  echo
  echo "Run:"
  echo "  npm run backend:bootstrap"
  exit 1
fi

cd "$ROOT/backend" || exit 1

exec "$PYTHON" "$@"
