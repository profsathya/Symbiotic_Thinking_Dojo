from datetime import datetime
from typing import Any

from fastapi import Header, HTTPException

import database


def validate_key(x_cti_key: str = Header(...)) -> dict[str, Any]:
    """Dependency that validates the CTI key from the X-CTI-Key header.

    Returns the key record if valid, raises HTTPException otherwise.
    """
    if not x_cti_key:
        raise HTTPException(status_code=401, detail="Missing X-CTI-Key header")

    key_data = database.get_key(x_cti_key)
    if key_data is None:
        raise HTTPException(status_code=401, detail="Invalid CTI key")

    if not key_data["active"]:
        raise HTTPException(status_code=403, detail="Key has been deactivated")

    # Check expiration
    if key_data["expires_at"]:
        expires = datetime.fromisoformat(key_data["expires_at"])
        if datetime.utcnow() > expires:
            raise HTTPException(status_code=403, detail="Key has expired")

    # Check budget — use combined input+output tokens against total budget
    used = key_data["used_tokens_input"] + key_data["used_tokens_output"]
    if used >= key_data["total_budget_tokens"]:
        raise HTTPException(status_code=403, detail="Token budget exhausted")

    return key_data
