from __future__ import annotations

import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from common import FRONTEND_BASE_URL


def main() -> int:
    print("=== FRONTEND ===")

    try:
        request = Request(FRONTEND_BASE_URL, method="GET")

        with urlopen(request, timeout=5) as response:
            if not 200 <= response.status < 300:
                print(f"[FAIL] frontend: HTTP {response.status}")
                return 1

            print(f"[PASS] frontend: HTTP {response.status}")
            print(f"[PASS] URL: {FRONTEND_BASE_URL}")
            return 0

    except HTTPError as exc:
        print(f"[FAIL] frontend: HTTP {exc.code}")
        return 1

    except URLError as exc:
        print(f"[FAIL] frontend unreachable: {exc.reason}")
        return 1

    except Exception as exc:
        print(f"[FAIL] frontend: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
