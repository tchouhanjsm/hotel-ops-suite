from __future__ import annotations

import os
import sys

from common import API_BASE_URL, ENV_FILE, ROOT, load_env_file, required_env


def main() -> int:
    print("=== ENVIRONMENT ===")

    try:
        load_env_file()

        database_url = required_env("STAGING_DATABASE_URL")
        username = required_env("STAGING_ADMIN_USERNAME")
        required_env("STAGING_ADMIN_PASSWORD")

        if "hotel_ops_staging" not in database_url:
            raise RuntimeError(
                "STAGING_DATABASE_URL does not target hotel_ops_staging."
            )

        backend_python = ROOT / "backend/.venv/bin/python"

        checks = {
            "staging env file": ENV_FILE.exists(),
            "staging database": "hotel_ops_staging" in database_url,
            "staging admin username": bool(username),
            "backend venv": backend_python.exists(),
        }

        for name, ok in checks.items():
            print(f"[{'PASS' if ok else 'FAIL'}] {name}")

        print(f"[INFO] API: {API_BASE_URL}")
        print("[PASS] staging environment configuration loaded")

        return 0

    except Exception as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
