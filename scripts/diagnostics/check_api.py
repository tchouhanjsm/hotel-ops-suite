from __future__ import annotations

import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from common import API_BASE_URL


def check(url: str) -> tuple[bool, str]:
    try:
        request = Request(url, method="GET")

        with urlopen(request, timeout=5) as response:
            return 200 <= response.status < 300, str(response.status)

    except HTTPError as exc:
        return False, str(exc.code)

    except URLError as exc:
        return False, str(exc.reason)

    except Exception as exc:
        return False, str(exc)


def main() -> int:
    print("=== API ===")

    ok, detail = check(f"{API_BASE_URL}/health")

    if not ok:
        print(f"[FAIL] API health: {detail}")
        return 1

    print(f"[PASS] API health: {detail}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
