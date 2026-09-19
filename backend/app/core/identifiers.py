import re
import secrets

_PREFIX_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{0,9}$")


def generate_reference(prefix: str, token_bytes: int = 4) -> str:
    """Generate a compact unique-reference candidate such as BK-1A2B3C4D."""
    normalized = prefix.strip().upper()

    if not _PREFIX_PATTERN.fullmatch(normalized):
        raise ValueError("Invalid reference prefix.")

    if token_bytes < 2:
        raise ValueError("token_bytes must be at least 2.")

    return f"{normalized}-{secrets.token_hex(token_bytes).upper()}"
