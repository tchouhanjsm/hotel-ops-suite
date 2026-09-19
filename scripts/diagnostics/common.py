from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT / ".env.staging.local"
API_BASE_URL = os.getenv("STAGING_API_URL", "http://localhost:8000")
FRONTEND_BASE_URL = os.getenv("STAGING_FRONTEND_URL", "http://localhost:5173")


def load_env_file() -> None:
    if not ENV_FILE.exists():
        raise RuntimeError(f"Missing {ENV_FILE}")

    for raw_line in ENV_FILE.read_text().splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]

        os.environ.setdefault(key, value)


def required_env(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(f"Missing required setting: {name}")

    return value
