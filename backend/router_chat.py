import asyncio
import logging
from typing import Any

import anthropic
from fastapi import APIRouter, Depends, HTTPException

import database
from auth import validate_key
from config import HAIKU_MODEL, SONNET_MODEL, get_provider_api_key
from models import ChatRequest, ChatResponse
from rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

# One async client per provider API key. Keys can differ per student (each CTI
# key may carry its own Anthropic key), so a single cached client would bill
# every student to whichever key happened to arrive first.
_clients: dict[str, anthropic.AsyncAnthropic] = {}


def _get_client(api_key: str) -> anthropic.AsyncAnthropic:
    client = _clients.get(api_key)
    if client is None:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        _clients[api_key] = client
    return client


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, key_data: dict[str, Any] = Depends(validate_key)):
    key_id = key_data["id"]
    check_rate_limit(key_id)

    # Select model based on request_type
    model = SONNET_MODEL if request.request_type == "reasoning" else HAIKU_MODEL

    # Build messages for Anthropic API
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    # Log request metadata only (no conversation content)
    logger.info(
        "chat_request key=%s request_type=%s model=%s message_count=%d",
        key_id,
        request.request_type,
        model,
        len(messages),
    )

    api_key = await asyncio.to_thread(get_provider_api_key, "anthropic", key_id)
    if not api_key:
        logger.error("no_anthropic_key key=%s", key_id)
        raise HTTPException(status_code=503, detail="No Anthropic API key configured")

    # Reserve the request's worst-case output up front so concurrent requests
    # can't all pass a stale budget check; settled to actual usage below.
    reserved_tokens = request.max_tokens
    if not await asyncio.to_thread(database.reserve_budget, key_id, reserved_tokens):
        raise HTTPException(status_code=403, detail="Token budget exhausted")

    try:
        client = _get_client(api_key)
        kwargs: dict[str, Any] = {
            "model": model,
            "max_tokens": request.max_tokens,
            "messages": messages,
        }
        if request.system:
            kwargs["system"] = request.system

        response = await client.messages.create(**kwargs)
    except Exception as e:
        # No tokens were consumed on our ledger — return the reservation.
        await asyncio.to_thread(database.release_budget, key_id, reserved_tokens)
        if isinstance(e, anthropic.APIStatusError):
            logger.error("anthropic_api_error key=%s status=%d", key_id, e.status_code)
        elif isinstance(e, anthropic.APIConnectionError):
            logger.error("anthropic_connection_error key=%s", key_id)
        raise

    # Extract usage
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens

    # Replace the reservation with actual usage
    await asyncio.to_thread(
        database.settle_usage, key_id, input_tokens, output_tokens, reserved_tokens
    )

    logger.info(
        "chat_response key=%s input_tokens=%d output_tokens=%d",
        key_id,
        input_tokens,
        output_tokens,
    )

    # Extract text content from response
    content = ""
    for block in response.content:
        if block.type == "text":
            content += block.text

    return ChatResponse(
        content=content,
        model=response.model,
        usage={
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
        },
    )
