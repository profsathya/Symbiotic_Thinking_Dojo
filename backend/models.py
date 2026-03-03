from typing import List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system: str = ""
    request_type: str = Field(default="reasoning", pattern="^(reasoning|extraction)$")
    max_tokens: int = Field(default=4096, ge=1, le=8192)


class ChatResponse(BaseModel):
    content: str
    model: str
    usage: dict


class BudgetResponse(BaseModel):
    remaining_tokens: int
    total_budget: int
    used_tokens: int
    expires_at: Optional[str]


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
