#!/bin/bash
set -euo pipefail

BAD_REQUESTS="$(
  grep -RIn 'cy\.request(' \
    cypress/e2e \
    cypress/support \
    --exclude='uatApi.ts' \
    || true
)"

BAD_URLS="$(
  grep -RInE \
    'http://localhost:8000|http://127\.0\.0\.1:8000|Cypress\.env\(' \
    cypress/e2e \
    cypress/support \
    || true
)"

if [ -n "$BAD_REQUESTS" ]; then
  echo "[FAIL] Direct cy.request() found outside uatApi.ts:"
  echo "$BAD_REQUESTS"
  exit 1
fi

if [ -n "$BAD_URLS" ]; then
  echo "[FAIL] Forbidden Cypress/API boundary usage found:"
  echo "$BAD_URLS"
  exit 1
fi

echo "[PASS] Cypress API boundary is clean."
