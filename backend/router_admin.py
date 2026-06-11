from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field

import database
from config import ADMIN_API_KEY, DATABASE_TYPE, DATABASE_PATH, DATABASE_URL, get_admin_api_key, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

router = APIRouter()
logger = logging.getLogger(__name__)


# Authentication
async def verify_admin(x_admin_key: Optional[str] = Header(None)) -> None:
    """Verify admin API key from X-Admin-Key header."""
    logger.info(f"Admin auth attempt - provided key: {x_admin_key[:10] if x_admin_key else None}...")
    
    if not x_admin_key:
        logger.warning("Admin auth failed: No key provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin API key required"
        )
    
    # Check against database admin keys first
    admin_key = database.validate_admin_key(x_admin_key)
    if admin_key:
        logger.info(f"Admin auth successful via database: {admin_key['id']}")
        return
    
    logger.info("Database check failed, checking legacy ADMIN_API_KEY")
    
    # Fallback to legacy ADMIN_API_KEY from config
    current_key = get_admin_api_key()
    logger.info(f"ADMIN_API_KEY from config: '{current_key[:10] if current_key else None}...' (length: {len(current_key) if current_key else 0})")
    logger.info(f"Provided key: '{x_admin_key[:10]}...' (length: {len(x_admin_key)})")
    logger.info(f"String comparison: {current_key == x_admin_key if current_key else 'No config key'}")
    
    if current_key and x_admin_key == current_key:
        logger.info("Admin auth successful via legacy ADMIN_API_KEY")
        return
    
    logger.warning(f"Admin auth failed: Invalid key")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin API key"
    )


# Pydantic models
class KeyCreateRequest(BaseModel):
    email: str
    name: Optional[str] = None
    budget: int = Field(default=5_000_000, ge=1)
    expires: Optional[str] = None
    notes: Optional[str] = None
    openai_key: Optional[str] = None
    anthropic_key: Optional[str] = None
    google_key: Optional[str] = None
    github_key: Optional[str] = None


class KeyResponse(BaseModel):
    id: str
    student_email: str
    student_name: Optional[str]
    total_budget_tokens: int
    used_tokens_input: int
    used_tokens_output: int
    active: bool
    created_at: str
    expires_at: Optional[str]
    last_used_at: Optional[str]
    notes: Optional[str]
    openai_key: Optional[str]
    anthropic_key: Optional[str]
    google_key: Optional[str]
    github_key: Optional[str]


class BulkCreateRequest(BaseModel):
    students: List[dict]  # Each dict must have 'email', optional 'name'
    budget: int = Field(default=5_000_000, ge=1)
    expires: Optional[str] = None


class BulkCreateResponse(BaseModel):
    created: List[KeyResponse]
    failed: List[dict]


class AddBudgetRequest(BaseModel):
    tokens: int = Field(gt=0)


class KeyStatsResponse(BaseModel):
    total_keys: int
    active_keys: int
    total_budget: int
    total_used: int
    total_remaining: int


# Public endpoint (no authentication)
@router.get("/api/admin/rate-limit-status")
async def get_rate_limit_status():
    """Get current rate limiting configuration."""
    return {
        "rate_limit_requests": RATE_LIMIT_REQUESTS,
        "rate_limit_window_seconds": RATE_LIMIT_WINDOW_SECONDS,
        "description": f"Maximum {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW_SECONDS} seconds per CTI key"
    }


# Authenticated endpoints
@router.get("/api/admin/keys", response_model=List[KeyResponse], dependencies=[Depends(verify_admin)])
async def list_keys(active_only: bool = False):
    """List all CTI keys."""
    keys = database.list_keys(active_only=active_only)
    return keys


@router.get("/api/admin/keys/{key_id}", response_model=KeyResponse, dependencies=[Depends(verify_admin)])
async def get_key(key_id: str):
    """Get details of a specific key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")
    return key_data


@router.post("/api/admin/keys", response_model=KeyResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_admin)])
async def create_key(request: KeyCreateRequest):
    """Create a new CTI key."""
    import uuid
    key_id = str(uuid.uuid4())

    database.create_key(
        key_id=key_id,
        student_email=request.email,
        student_name=request.name,
        total_budget_tokens=request.budget,
        expires_at=request.expires,
        notes=request.notes,
        openai_key=request.openai_key,
        anthropic_key=request.anthropic_key,
        google_key=request.google_key,
        github_key=request.github_key,
    )

    key_data = database.get_key(key_id)
    return key_data


@router.post("/api/admin/keys/bulk", response_model=BulkCreateResponse, dependencies=[Depends(verify_admin)])
async def bulk_create_keys(request: BulkCreateRequest):
    """Bulk create CTI keys from a list of students."""
    import uuid

    created = []
    failed = []

    for student in request.students:
        try:
            email = student.get("email")
            if not email:
                failed.append({"student": student, "error": "Missing email"})
                continue

            key_id = str(uuid.uuid4())
            database.create_key(
                key_id=key_id,
                student_email=email,
                student_name=student.get("name"),
                total_budget_tokens=request.budget,
                expires_at=request.expires,
                openai_key=student.get("openai_key"),
                anthropic_key=student.get("anthropic_key"),
                google_key=student.get("google_key"),
                github_key=student.get("github_key"),
            )

            key_data = database.get_key(key_id)
            created.append(key_data)
        except Exception as e:
            failed.append({"student": student, "error": str(e)})

    return BulkCreateResponse(created=created, failed=failed)


@router.post("/api/admin/keys/{key_id}/deactivate", dependencies=[Depends(verify_admin)])
async def deactivate_key(key_id: str):
    """Deactivate a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")
    
    database.set_key_active(key_id, False)
    return {"message": "Key deactivated", "email": key_data["student_email"]}


@router.post("/api/admin/keys/{key_id}/reactivate", dependencies=[Depends(verify_admin)])
async def reactivate_key(key_id: str):
    """Reactivate a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")

    database.set_key_active(key_id, True)
    return {"message": "Key reactivated", "email": key_data["student_email"]}


@router.delete("/api/admin/keys/{key_id}", dependencies=[Depends(verify_admin)])
async def delete_key(key_id: str):
    """Delete a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")

    database.delete_key(key_id)
    return {"success": True, "message": "CTI key deleted successfully", "email": key_data["student_email"]}


@router.post("/api/admin/keys/{key_id}/add-budget", dependencies=[Depends(verify_admin)])
async def add_budget(key_id: str, request: AddBudgetRequest):
    """Set the total budget for a key to a specific value."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")

    used_tokens = key_data["used_tokens_input"] + key_data["used_tokens_output"]

    # Prevent setting budget below used tokens
    if request.tokens < used_tokens:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot set budget below used tokens ({used_tokens:,}). Please set budget to at least {used_tokens:,}."
        )

    database.set_budget(key_id, request.tokens)

    return {
        "message": "Budget updated",
        "email": key_data["student_email"],
        "new_total_budget": request.tokens
    }


class UpdateLabelRequest(BaseModel):
    label: str


@router.post("/api/admin/keys/{key_id}/label", dependencies=[Depends(verify_admin)])
async def update_key_label(key_id: str, request: UpdateLabelRequest):
    """Update the label for a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")
    
    database.update_key_label(key_id, request.label)
    return {"success": True, "message": "Label updated successfully"}


@router.get("/api/admin/stats", response_model=KeyStatsResponse, dependencies=[Depends(verify_admin)])
async def get_stats():
    """Get overall statistics for all keys."""
    keys = database.list_keys()
    
    total_keys = len(keys)
    active_keys = sum(1 for k in keys if k["active"])
    total_budget = sum(k["total_budget_tokens"] for k in keys)
    total_used = sum(k["used_tokens_input"] + k["used_tokens_output"] for k in keys)
    total_remaining = max(0, total_budget - total_used)
    
    return KeyStatsResponse(
        total_keys=total_keys,
        active_keys=active_keys,
        total_budget=total_budget,
        total_used=total_used,
        total_remaining=total_remaining
    )


@router.get("/api/admin/usage", dependencies=[Depends(verify_admin)])
async def export_usage():
    """Export all usage data (CSV format)."""
    keys = database.list_keys()
    
    results = []
    for k in keys:
        used = k["used_tokens_input"] + k["used_tokens_output"]
        results.append({
            "key_id": k["id"],
            "email": k["student_email"],
            "name": k["student_name"] or "",
            "input_tokens": k["used_tokens_input"],
            "output_tokens": k["used_tokens_output"],
            "total_used": used,
            "budget": k["total_budget_tokens"],
            "remaining": max(0, k["total_budget_tokens"] - used),
            "active": k["active"],
            "created": k["created_at"],
            "expires": k["expires_at"] or "",
            "last_used": k["last_used_at"] or "",
        })
    
    return {"data": results}


@router.get("/api/admin/database", dependencies=[Depends(verify_admin)])
async def get_database_info():
    """Get database configuration information."""
    return {
        "type": DATABASE_TYPE,
        "path": DATABASE_PATH if DATABASE_TYPE == "sqlite" else None,
        "url": DATABASE_URL if DATABASE_TYPE == "postgres" else None,
    }


@router.get("/api/admin/config", dependencies=[Depends(verify_admin)])
async def get_config_info():
    """Get admin configuration information (without sensitive data)."""
    admin_key = get_admin_api_key()
    admin_key_label = database.get_admin_setting("admin_api_key_label")
    return {
        "admin_key_configured": bool(admin_key),
        "admin_key_length": len(admin_key) if admin_key else 0,
        "admin_key_label": admin_key_label,
    }


@router.get("/api/admin/config/key", dependencies=[Depends(verify_admin)])
async def get_admin_key():
    """Get the admin API key (for display purposes)."""
    return {
        "admin_key": get_admin_api_key(),
    }


class UpdateAdminKeyRequest(BaseModel):
    new_key: str = Field(..., min_length=32)
    label: Optional[str] = None


@router.post("/api/admin/config/key", dependencies=[Depends(verify_admin)])
async def update_admin_key(request: UpdateAdminKeyRequest):
    """Update the admin API key (stored in database)."""
    database.set_admin_setting("admin_api_key", request.new_key)
    if request.label is not None:
        database.set_admin_setting("admin_api_key_label", request.label)
    return {"success": True, "message": "Admin key updated successfully"}


class UpdateAdminKeyLabelRequest(BaseModel):
    label: str


@router.post("/api/admin/config/key/label", dependencies=[Depends(verify_admin)])
async def update_admin_key_label(request: UpdateAdminKeyLabelRequest):
    """Update the admin API key label (stored in database)."""
    database.set_admin_setting("admin_api_key_label", request.label)
    return {"success": True, "message": "Admin key label updated successfully"}


class DatabaseConfigRequest(BaseModel):
    database_type: str = Field(..., pattern="^(sqlite|postgres)$")
    database_path: Optional[str] = None
    database_url: Optional[str] = None


@router.get("/api/admin/database/config", dependencies=[Depends(verify_admin)])
async def get_database_config():
    """Get database configuration from settings or environment."""
    db_type = database.get_admin_setting("database_type") or DATABASE_TYPE
    db_path = database.get_admin_setting("database_path") or (DATABASE_PATH if DATABASE_TYPE == "sqlite" else None)
    db_url = database.get_admin_setting("database_url") or (DATABASE_URL if DATABASE_TYPE == "postgres" else None)
    
    return {
        "database_type": db_type,
        "database_path": db_path,
        "database_url": db_url,
    }


@router.post("/api/admin/database/config", dependencies=[Depends(verify_admin)])
async def update_database_config(request: DatabaseConfigRequest):
    """Update database configuration (stored in database, requires server restart)."""
    database.set_admin_setting("database_type", request.database_type)
    if request.database_path:
        database.set_admin_setting("database_path", request.database_path)
    if request.database_url:
        database.set_admin_setting("database_url", request.database_url)
    
    return {
        "success": True, 
        "message": "Database configuration updated. Server restart required for changes to take effect."
    }


# Admin Key Management
class AdminKeyCreateRequest(BaseModel):
    key_value: str = Field(..., min_length=32)
    label: Optional[str] = None
    notes: Optional[str] = None


@router.post("/api/admin/keys/admin", dependencies=[Depends(verify_admin)])
async def create_admin_key(request: AdminKeyCreateRequest):
    """Create a new admin key."""
    import uuid
    key_id = str(uuid.uuid4())
    database.create_admin_key(key_id, request.key_value, request.label, request.notes)
    return {"success": True, "id": key_id, "message": "Admin key created successfully"}


@router.get("/api/admin/keys/admin", dependencies=[Depends(verify_admin)])
async def list_admin_keys():
    """List all admin keys."""
    keys = database.get_admin_keys()
    # Don't expose the actual key values in the list
    return [
        {
            "id": k["id"],
            "label": k["label"],
            "active": k["active"],
            "created_at": k["created_at"],
            "last_used_at": k["last_used_at"],
            "notes": k["notes"],
        }
        for k in keys
    ]


@router.delete("/api/admin/keys/admin/{key_id}", dependencies=[Depends(verify_admin)])
async def delete_admin_key(key_id: str):
    """Delete an admin key."""
    database.delete_admin_key(key_id)
    return {"success": True, "message": "Admin key deleted successfully"}


@router.post("/api/admin/keys/admin/{key_id}/activate", dependencies=[Depends(verify_admin)])
async def activate_admin_key(key_id: str):
    """Activate an admin key."""
    database.set_admin_key_active(key_id, True)
    return {"success": True, "message": "Admin key activated successfully"}


@router.post("/api/admin/keys/admin/{key_id}/deactivate", dependencies=[Depends(verify_admin)])
async def deactivate_admin_key(key_id: str):
    """Deactivate an admin key."""
    database.set_admin_key_active(key_id, False)
    return {"success": True, "message": "Admin key deactivated successfully"}


@router.post("/api/admin/keys/admin/{key_id}/label", dependencies=[Depends(verify_admin)])
async def update_admin_key_label_endpoint(key_id: str, request: UpdateAdminKeyLabelRequest):
    """Update the label for an admin key."""
    database.update_admin_key_label(key_id, request.label)
    return {"success": True, "message": "Admin key label updated successfully"}


# Provider Keys Management
class ProviderKeyCreateRequest(BaseModel):
    provider: str = Field(..., pattern="^(openai|anthropic|google|github)$")
    key_value: str = Field(..., min_length=1)
    label: Optional[str] = None
    notes: Optional[str] = None


@router.post("/api/admin/provider-keys", dependencies=[Depends(verify_admin)])
async def create_provider_key(request: ProviderKeyCreateRequest):
    """Create a new provider API key."""
    import uuid
    key_id = str(uuid.uuid4())
    database.create_provider_key(key_id, request.provider, request.key_value, request.label, request.notes)
    return {"success": True, "id": key_id, "message": "Provider key created successfully"}


@router.get("/api/admin/provider-keys", dependencies=[Depends(verify_admin)])
async def list_provider_keys():
    """List all provider keys."""
    keys = database.get_provider_keys()
    # Don't expose the actual key values in the list
    return [
        {
            "id": k["id"],
            "provider": k["provider"],
            "label": k["label"],
            "active": k["active"],
            "created_at": k["created_at"],
            "last_used_at": k["last_used_at"],
            "notes": k["notes"],
        }
        for k in keys
    ]


@router.get("/api/admin/provider-keys/{provider}", dependencies=[Depends(verify_admin)])
async def list_provider_keys_by_provider(provider: str):
    """List all provider keys for a specific provider."""
    keys = database.get_provider_keys_by_provider(provider)
    return [
        {
            "id": k["id"],
            "provider": k["provider"],
            "label": k["label"],
            "active": k["active"],
            "created_at": k["created_at"],
            "last_used_at": k["last_used_at"],
            "notes": k["notes"],
        }
        for k in keys
    ]


@router.delete("/api/admin/provider-keys/{key_id}", dependencies=[Depends(verify_admin)])
async def delete_provider_key(key_id: str):
    """Delete a provider key."""
    database.delete_provider_key(key_id)
    return {"success": True, "message": "Provider key deleted successfully"}


@router.post("/api/admin/provider-keys/{key_id}/activate", dependencies=[Depends(verify_admin)])
async def activate_provider_key(key_id: str):
    """Activate a provider key."""
    database.set_provider_key_active(key_id, True)
    return {"success": True, "message": "Provider key activated successfully"}


@router.post("/api/admin/provider-keys/{key_id}/deactivate", dependencies=[Depends(verify_admin)])
async def deactivate_provider_key(key_id: str):
    """Deactivate a provider key."""
    database.set_provider_key_active(key_id, False)
    return {"success": True, "message": "Provider key deactivated successfully"}


@router.post("/api/admin/provider-keys/{key_id}/label", dependencies=[Depends(verify_admin)])
async def update_provider_key_label_endpoint(key_id: str, request: UpdateAdminKeyLabelRequest):
    """Update the label for a provider key."""
    database.update_provider_key_label(key_id, request.label)
    return {"success": True, "message": "Provider key label updated successfully"}
