from fastapi import APIRouter
from config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

router = APIRouter()

@router.get("/api/admin/rate-limit-status")
async def get_rate_limit_status():
    """Get current rate limiting configuration."""
    return {
        "rate_limit_requests": RATE_LIMIT_REQUESTS,
        "rate_limit_window_seconds": RATE_LIMIT_WINDOW_SECONDS,
        "description": f"Maximum {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW_SECONDS} seconds per CTI key"
    }
