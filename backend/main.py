import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import anthropic
import database
from config import CORS_ORIGINS
from router_budget import router as budget_router
from router_chat import router as chat_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(title="Symbiotic Thinking Dojo — CTI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-CTI-Key"],
)

app.include_router(chat_router)
app.include_router(budget_router)


@app.on_event("startup")
def startup():
    database.init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.exception_handler(anthropic.RateLimitError)
async def anthropic_rate_limit_handler(request: Request, exc: anthropic.RateLimitError):
    # The whole program shares one Anthropic account, so org-level rate limits
    # (requests/tokens per minute) can trip during class sessions. Surface this
    # as a retryable 429 — NOT as a budget/credit problem for the student.
    retry_after = exc.response.headers.get("retry-after", "30")
    try:
        retry_seconds = max(1, int(float(retry_after)))
    except ValueError:
        retry_seconds = 30
    return JSONResponse(
        status_code=429,
        content={
            "error": "Upstream rate limit",
            "detail": (
                "The Dojo's shared AI service is handling many requests right now. "
                f"Please wait about {retry_seconds} seconds and try again. "
                "Your token budget is not affected."
            ),
            "retry_after_seconds": retry_seconds,
        },
        headers={"Retry-After": str(retry_seconds)},
    )


@app.exception_handler(anthropic.APIStatusError)
async def anthropic_status_error_handler(request: Request, exc: anthropic.APIStatusError):
    message = str(exc.message)

    # Anthropic's "credit balance is too low" error refers to the program's
    # shared account, not the student's CTI token budget. Without this branch
    # the raw message reaches students and reads as "your credits ran out."
    if "credit balance" in message.lower() or getattr(exc, "type", None) == "billing_error":
        return JSONResponse(
            status_code=503,
            content={
                "error": "Upstream account issue",
                "detail": (
                    "The Dojo's shared AI account needs attention from the program "
                    "coordinator. This is not your token budget — please notify your "
                    "coordinator and try again later."
                ),
            },
        )

    if exc.status_code == 529:
        return JSONResponse(
            status_code=503,
            content={
                "error": "Upstream overloaded",
                "detail": "The AI service is temporarily overloaded. Please wait a moment and try again.",
            },
        )

    return JSONResponse(
        status_code=502,
        content={"error": "Upstream API error", "detail": message},
    )


@app.exception_handler(anthropic.APIConnectionError)
async def anthropic_connection_error_handler(request: Request, exc: anthropic.APIConnectionError):
    return JSONResponse(
        status_code=502,
        content={"error": "Upstream API connection error"},
    )
