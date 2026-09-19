from __future__ import annotations

import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from common import API_BASE_URL, load_env_file, required_env


def request_json(
    url: str,
    method: str,
    body: dict | None = None,
    token: str | None = None,
) -> tuple[int, dict]:
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(body).encode() if body is not None else None

    request = Request(
        url,
        data=data,
        headers=headers,
        method=method,
    )

    try:
        with urlopen(request, timeout=5) as response:
            return response.status, json.loads(response.read())

    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"detail": raw or "HTTP error"}

        return exc.code, payload


def main() -> int:
    print("=== AUTHENTICATION ===")

    try:
        load_env_file()

        username = required_env("STAGING_ADMIN_USERNAME")
        password = required_env("STAGING_ADMIN_PASSWORD")

        status, login = request_json(
            f"{API_BASE_URL}/auth/login",
            "POST",
            {
                "username": username,
                "password": password,
            },
        )

        if status != 200:
            detail = login.get("detail", "authentication failed")
            print(f"[FAIL] login: HTTP {status} - {detail}")
            return 1

        token = login.get("access_token")

        if not token:
            print("[FAIL] login succeeded but access_token is missing")
            return 1

        status, profile = request_json(
            f"{API_BASE_URL}/staff/me",
            "GET",
            token=token,
        )

        if status != 200:
            detail = profile.get("detail", "profile request failed")
            print(f"[FAIL] authenticated profile: HTTP {status} - {detail}")
            return 1

        actual_username = profile.get("username")
        role = profile.get("role")

        if actual_username != username:
            print("[FAIL] authenticated username does not match staging admin")
            return 1

        print(f"[PASS] login: {actual_username}")
        print(f"[PASS] role: {role}")
        print("[PASS] authenticated API access")

        return 0

    except (URLError, OSError) as exc:
        print(f"[FAIL] API connection: {exc}", file=sys.stderr)
        return 1

    except Exception as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
