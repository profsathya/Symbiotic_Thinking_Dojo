import time
from collections import defaultdict

from fastapi import HTTPException

from config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

# In-memory store: key_id -> list of request timestamps
_request_log: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(key_id: str) -> None:
    """Enforce per-key rate limiting. Raises 429 if limit exceeded."""
    now = time.monotonic()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    # Prune old entries
    timestamps = _request_log[key_id]
    _request_log[key_id] = [t for t in timestamps if t > window_start]

    if len(_request_log[key_id]) >= RATE_LIMIT_REQUESTS:
        oldest = min(_request_log[key_id])
        retry_after = max(1, int(oldest + RATE_LIMIT_WINDOW_SECONDS - now) + 1)
        raise HTTPException(
            status_code=429,
            detail=(
                f"Rate limited: max {RATE_LIMIT_REQUESTS} requests per "
                f"{RATE_LIMIT_WINDOW_SECONDS}s. Try again in {retry_after} seconds."
            ),
            headers={"Retry-After": str(retry_after)},
        )

    _request_log[key_id].append(now)
