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


@app.exception_handler(anthropic.APIStatusError)
async def anthropic_status_error_handler(request: Request, exc: anthropic.APIStatusError):
    return JSONResponse(
        status_code=502,
        content={"error": "Upstream API error", "detail": str(exc.message)},
    )


@app.exception_handler(anthropic.APIConnectionError)
async def anthropic_connection_error_handler(request: Request, exc: anthropic.APIConnectionError):
    return JSONResponse(
        status_code=502,
        content={"error": "Upstream API connection error"},
    )
