from typing import Any

from fastapi import APIRouter, Depends

from auth import validate_key
from models import BudgetResponse

router = APIRouter()


@router.get("/api/budget", response_model=BudgetResponse)
async def budget(key_data: dict[str, Any] = Depends(validate_key)):
    used = key_data["used_tokens_input"] + key_data["used_tokens_output"]
    total = key_data["total_budget_tokens"]

    return BudgetResponse(
        remaining_tokens=max(0, total - used),
        total_budget=total,
        used_tokens=used,
        expires_at=key_data.get("expires_at"),
    )
