import logging
from typing import Any

import anthropic
from fastapi import APIRouter, Depends

import database
from auth import validate_key
from config import ANTHROPIC_API_KEY, HAIKU_MODEL, SONNET_MODEL
from models import ChatRequest, ChatResponse
from rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client


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

    try:
        client = _get_client()
        kwargs: dict[str, Any] = {
            "model": model,
            "max_tokens": request.max_tokens,
            "messages": messages,
        }
        if request.system:
            kwargs["system"] = request.system

        response = client.messages.create(**kwargs)
    except anthropic.APIStatusError as e:
        logger.error("anthropic_api_error key=%s status=%d", key_id, e.status_code)
        raise
    except anthropic.APIConnectionError:
        logger.error("anthropic_connection_error key=%s", key_id)
        raise

    # Extract usage
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens

    # Update token usage in database
    database.update_usage(key_id, input_tokens, output_tokens)

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
