from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field

import database
from config import ADMIN_API_KEY, DATABASE_TYPE, DATABASE_PATH, DATABASE_URL, get_admin_api_key

# Authentication
def verify_admin(x_admin_key: Optional[str] = Header(None)) -> None:
    """Verify admin API key from X-Admin-Key header."""
    if not x_admin_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin API key required"
        )
    
    # Check against database admin keys first
    admin_key = database.validate_admin_key(x_admin_key)
    if admin_key:
        return
    
    # Fallback to legacy ADMIN_API_KEY from config
    current_key = get_admin_api_key()
    if current_key and x_admin_key == current_key:
        return
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin API key"
    )


# Every route on this router requires a valid X-Admin-Key. Declaring the
# dependency at the router level means a newly added admin route is
# authenticated by default rather than by remembering to opt in.
router = APIRouter(dependencies=[Depends(verify_admin)])


# A course filter of this value selects the keys that belong to no course at
# all — course IDs are uuids, so it can never collide with a real one.
NO_COURSE = "none"


def _resolve_course_filter(course_id: Optional[str]) -> dict:
    """Turn a course_id query param into database.list_keys() keyword args."""
    if course_id is None or course_id == "":
        return {}
    if course_id == NO_COURSE:
        return {"unassigned_only": True}
    return {"course_id": course_id}


# Pydantic models
#
# Every Optional field carries an explicit `= None` default. Production rows
# predate some of these columns, and a field without a default makes Pydantic
# treat a missing key as a validation error — which surfaces as a 500.
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
    course_id: Optional[str] = None


class KeyResponse(BaseModel):
    id: str
    student_email: str
    student_name: Optional[str] = None
    total_budget_tokens: int
    used_tokens_input: int
    used_tokens_output: int
    active: bool
    created_at: str
    expires_at: Optional[str] = None
    last_used_at: Optional[str] = None
    notes: Optional[str] = None
    openai_key: Optional[str] = None
    anthropic_key: Optional[str] = None
    google_key: Optional[str] = None
    github_key: Optional[str] = None
    course_id: Optional[str] = None


class BulkCreateRequest(BaseModel):
    students: List[dict]  # Each dict must have 'email', optional 'name'
    budget: int = Field(default=5_000_000, ge=1)
    expires: Optional[str] = None
    course_id: Optional[str] = None


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


class CourseResponse(BaseModel):
    id: str
    name: str
    term: Optional[str] = None
    active: bool
    created_at: Optional[str] = None
    notes: Optional[str] = None
    key_count: int = 0
    total_used_tokens: int = 0


class CourseCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    term: Optional[str] = None
    notes: Optional[str] = None


class CourseUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    term: Optional[str] = None
    notes: Optional[str] = None


class MoveKeyToCourseRequest(BaseModel):
    course_id: Optional[str] = None


# Endpoints
@router.get("/api/admin/keys", response_model=List[KeyResponse])
def list_keys(active_only: bool = False, course_id: Optional[str] = None):
    """List all CTI keys.

    `course_id` filters to one course; pass "none" for keys in no course.
    """
    keys = database.list_keys(active_only=active_only, **_resolve_course_filter(course_id))
    return keys


@router.get("/api/admin/keys/{key_id}", response_model=KeyResponse)
def get_key(key_id: str):
    """Get details of a specific key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")
    return key_data


@router.post("/api/admin/keys", response_model=KeyResponse, status_code=status.HTTP_201_CREATED)
def create_key(request: KeyCreateRequest):
    """Create a new CTI key, optionally filed under a course."""
    import uuid
    key_id = str(uuid.uuid4())

    if request.course_id and not database.get_course(request.course_id):
        raise HTTPException(status_code=404, detail="Course not found")

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
        course_id=request.course_id,
    )

    key_data = database.get_key(key_id)
    return key_data


@router.post("/api/admin/keys/bulk", response_model=BulkCreateResponse)
def bulk_create_keys(request: BulkCreateRequest):
    """Bulk create CTI keys from a list of students.

    A per-student `course_id` wins over the request-level one, so a mixed CSV
    can still place each key individually.
    """
    import uuid

    if request.course_id and not database.get_course(request.course_id):
        raise HTTPException(status_code=404, detail="Course not found")

    failed = []
    pending = []
    # cti_keys.course_id has no foreign key, so an unchecked id would be stored
    # verbatim and the key would show up under neither that course nor "no
    # course". Validate every distinct id once, and reject just the offending
    # student rather than the whole batch.
    known_courses: dict = {}

    def course_exists(candidate: str) -> bool:
        if candidate not in known_courses:
            known_courses[candidate] = database.get_course(candidate) is not None
        return known_courses[candidate]

    # Validate first so the write phase is a single uninterrupted transaction.
    for student in request.students:
        email = student.get("email")
        if not email:
            failed.append({"student": student, "error": "Missing email"})
            continue

        course_id = student.get("course_id") or request.course_id
        if course_id and not course_exists(course_id):
            failed.append({"student": student, "error": f"Course not found: {course_id}"})
            continue

        pending.append((student, {
            "key_id": str(uuid.uuid4()),
            "student_email": email,
            "student_name": student.get("name"),
            "total_budget_tokens": request.budget,
            "expires_at": request.expires,
            "openai_key": student.get("openai_key"),
            "anthropic_key": student.get("anthropic_key"),
            "google_key": student.get("google_key"),
            "github_key": student.get("github_key"),
            "course_id": course_id,
        }))

    # One connection and one transaction for the whole batch. The previous
    # create-then-read-back per student opened two connections each, which on
    # postgres meant a fresh TLS handshake per key.
    result = database.create_keys([row for _, row in pending])
    for failure in result["failed"]:
        student, _ = pending[failure["index"]]
        failed.append({"student": student, "error": failure["error"]})

    return BulkCreateResponse(created=result["created"], failed=failed)


@router.post("/api/admin/keys/{key_id}/deactivate")
def deactivate_key(key_id: str):
    """Deactivate a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")
    
    database.set_key_active(key_id, False)
    return {"message": "Key deactivated", "email": key_data["student_email"]}


@router.post("/api/admin/keys/{key_id}/reactivate")
def reactivate_key(key_id: str):
    """Reactivate a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")

    database.set_key_active(key_id, True)
    return {"message": "Key reactivated", "email": key_data["student_email"]}


@router.delete("/api/admin/keys/{key_id}")
def delete_key(key_id: str):
    """Delete a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")

    database.delete_key(key_id)
    return {"success": True, "message": "CTI key deleted successfully", "email": key_data["student_email"]}


@router.post("/api/admin/keys/{key_id}/add-budget")
def add_budget(key_id: str, request: AddBudgetRequest):
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


@router.post("/api/admin/keys/{key_id}/label")
def update_key_label(key_id: str, request: UpdateLabelRequest):
    """Update the label for a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")
    
    database.update_key_label(key_id, request.label)
    return {"success": True, "message": "Label updated successfully"}


@router.post("/api/admin/keys/{key_id}/course")
def move_key_to_course(key_id: str, request: MoveKeyToCourseRequest):
    """Move a CTI key into a course, or out of every course with a null id."""
    key_data = database.get_key(key_id)
    if not key_data:
        raise HTTPException(status_code=404, detail="Key not found")

    course_name = None
    if request.course_id:
        course = database.get_course(request.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        course_name = course["name"]

    database.set_key_course(key_id, request.course_id or None)
    return {
        "success": True,
        "message": f"Key moved to {course_name}" if course_name else "Key removed from its course",
        "course_id": request.course_id or None,
        "course_name": course_name,
    }


@router.get("/api/admin/stats", response_model=KeyStatsResponse)
def get_stats(course_id: Optional[str] = None):
    """Get overall statistics for all keys.

    `course_id` narrows the numbers to one course; pass "none" for the keys
    that belong to no course.
    """
    keys = database.list_keys(**_resolve_course_filter(course_id))

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


@router.get("/api/admin/usage")
def export_usage(course_id: Optional[str] = None):
    """Export usage data, optionally narrowed to a single course."""
    keys = database.list_keys(**_resolve_course_filter(course_id))
    course_names = {c["id"]: c["name"] for c in database.list_courses()}

    results = []
    for k in keys:
        used = k["used_tokens_input"] + k["used_tokens_output"]
        results.append({
            "key_id": k["id"],
            "email": k["student_email"],
            "name": k["student_name"] or "",
            "course": course_names.get(k.get("course_id"), ""),
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


# Course Management
@router.get("/api/admin/courses", response_model=List[CourseResponse])
def list_courses():
    """List all courses with their key counts and total tokens used."""
    return database.list_courses()


@router.post("/api/admin/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(request: CourseCreateRequest):
    """Create a new course."""
    import uuid

    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Course name is required")
    if database.get_course_by_name(name):
        raise HTTPException(status_code=409, detail=f'A course named "{name}" already exists')

    course_id = str(uuid.uuid4())
    database.create_course(
        course_id=course_id,
        name=name,
        term=request.term,
        notes=request.notes,
    )
    return {**database.get_course(course_id), "key_count": 0, "total_used_tokens": 0}


@router.post("/api/admin/courses/{course_id}", response_model=CourseResponse)
def update_course(course_id: str, request: CourseUpdateRequest):
    """Rename a course and/or update its term and notes."""
    course = database.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    name = request.name.strip() if request.name is not None else None
    if request.name is not None and not name:
        raise HTTPException(status_code=400, detail="Course name cannot be empty")
    if name and name != course["name"]:
        if database.get_course_by_name(name):
            raise HTTPException(status_code=409, detail=f'A course named "{name}" already exists')

    database.update_course(course_id, name=name, term=request.term, notes=request.notes)
    return {
        **database.get_course(course_id),
        "key_count": database.count_keys_in_course(course_id),
    }


@router.post("/api/admin/courses/{course_id}/deactivate")
def deactivate_course(course_id: str):
    """Deactivate a course. Its keys keep their assignment."""
    if not database.get_course(course_id):
        raise HTTPException(status_code=404, detail="Course not found")

    database.set_course_active(course_id, False)
    return {"success": True, "message": "Course deactivated"}


@router.post("/api/admin/courses/{course_id}/reactivate")
def reactivate_course(course_id: str):
    """Reactivate a course."""
    if not database.get_course(course_id):
        raise HTTPException(status_code=404, detail="Course not found")

    database.set_course_active(course_id, True)
    return {"success": True, "message": "Course reactivated"}


@router.delete("/api/admin/courses/{course_id}")
def delete_course(course_id: str):
    """Delete a course. Refused while any key still belongs to it."""
    course = database.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    key_count = database.count_keys_in_course(course_id)
    if key_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot delete a course that still has {key_count} key(s). "
                "Move them to another course first, or deactivate this one instead."
            ),
        )

    database.delete_course(course_id)
    return {"success": True, "message": "Course deleted", "name": course["name"]}


@router.get("/api/admin/database")
def get_database_info():
    """Get database configuration information."""
    return {
        "type": DATABASE_TYPE,
        "path": DATABASE_PATH if DATABASE_TYPE == "sqlite" else None,
        "url": DATABASE_URL if DATABASE_TYPE == "postgres" else None,
    }


@router.get("/api/admin/config")
def get_config_info():
    """Get admin configuration information (without sensitive data)."""
    admin_key = get_admin_api_key()
    admin_key_label = database.get_admin_setting("admin_api_key_label")
    return {
        "admin_key_configured": bool(admin_key),
        "admin_key_length": len(admin_key) if admin_key else 0,
        "admin_key_label": admin_key_label,
    }


@router.get("/api/admin/config/key")
def get_admin_key():
    """Get the admin API key (for display purposes)."""
    return {
        "admin_key": get_admin_api_key(),
    }


class UpdateAdminKeyRequest(BaseModel):
    new_key: str = Field(..., min_length=32)
    label: Optional[str] = None


@router.post("/api/admin/config/key")
def update_admin_key(request: UpdateAdminKeyRequest):
    """Update the admin API key (stored in database)."""
    database.set_admin_setting("admin_api_key", request.new_key)
    if request.label is not None:
        database.set_admin_setting("admin_api_key_label", request.label)
    return {"success": True, "message": "Admin key updated successfully"}


class UpdateAdminKeyLabelRequest(BaseModel):
    label: str


@router.post("/api/admin/config/key/label")
def update_admin_key_label(request: UpdateAdminKeyLabelRequest):
    """Update the admin API key label (stored in database)."""
    database.set_admin_setting("admin_api_key_label", request.label)
    return {"success": True, "message": "Admin key label updated successfully"}


class DatabaseConfigRequest(BaseModel):
    database_type: str = Field(..., pattern="^(sqlite|postgres)$")
    database_path: Optional[str] = None
    database_url: Optional[str] = None


@router.get("/api/admin/database/config")
def get_database_config():
    """Get database configuration from settings or environment."""
    db_type = database.get_admin_setting("database_type") or DATABASE_TYPE
    db_path = database.get_admin_setting("database_path") or (DATABASE_PATH if DATABASE_TYPE == "sqlite" else None)
    db_url = database.get_admin_setting("database_url") or (DATABASE_URL if DATABASE_TYPE == "postgres" else None)
    
    return {
        "database_type": db_type,
        "database_path": db_path,
        "database_url": db_url,
    }


@router.post("/api/admin/database/config")
def update_database_config(request: DatabaseConfigRequest):
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


@router.post("/api/admin/keys/admin")
def create_admin_key(request: AdminKeyCreateRequest):
    """Create a new admin key."""
    import uuid
    key_id = str(uuid.uuid4())
    database.create_admin_key(key_id, request.key_value, request.label, request.notes)
    return {"success": True, "id": key_id, "message": "Admin key created successfully"}


@router.get("/api/admin/keys/admin")
def list_admin_keys():
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


@router.delete("/api/admin/keys/admin/{key_id}")
def delete_admin_key(key_id: str):
    """Delete an admin key."""
    database.delete_admin_key(key_id)
    return {"success": True, "message": "Admin key deleted successfully"}


@router.post("/api/admin/keys/admin/{key_id}/activate")
def activate_admin_key(key_id: str):
    """Activate an admin key."""
    database.set_admin_key_active(key_id, True)
    return {"success": True, "message": "Admin key activated successfully"}


@router.post("/api/admin/keys/admin/{key_id}/deactivate")
def deactivate_admin_key(key_id: str):
    """Deactivate an admin key."""
    database.set_admin_key_active(key_id, False)
    return {"success": True, "message": "Admin key deactivated successfully"}


@router.post("/api/admin/keys/admin/{key_id}/label")
def update_admin_key_label_endpoint(key_id: str, request: UpdateAdminKeyLabelRequest):
    """Update the label for an admin key."""
    database.update_admin_key_label(key_id, request.label)
    return {"success": True, "message": "Admin key label updated successfully"}


# Provider Keys Management
class ProviderKeyCreateRequest(BaseModel):
    provider: str = Field(..., pattern="^(openai|anthropic|google|github)$")
    key_value: str = Field(..., min_length=1)
    label: Optional[str] = None
    notes: Optional[str] = None


@router.post("/api/admin/provider-keys")
def create_provider_key(request: ProviderKeyCreateRequest):
    """Create a new provider API key."""
    import uuid
    key_id = str(uuid.uuid4())
    database.create_provider_key(key_id, request.provider, request.key_value, request.label, request.notes)
    return {"success": True, "id": key_id, "message": "Provider key created successfully"}


@router.get("/api/admin/provider-keys")
def list_provider_keys():
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


@router.get("/api/admin/provider-keys/{provider}")
def list_provider_keys_by_provider(provider: str):
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


@router.delete("/api/admin/provider-keys/{key_id}")
def delete_provider_key(key_id: str):
    """Delete a provider key."""
    database.delete_provider_key(key_id)
    return {"success": True, "message": "Provider key deleted successfully"}


@router.post("/api/admin/provider-keys/{key_id}/activate")
def activate_provider_key(key_id: str):
    """Activate a provider key."""
    database.set_provider_key_active(key_id, True)
    return {"success": True, "message": "Provider key activated successfully"}


@router.post("/api/admin/provider-keys/{key_id}/deactivate")
def deactivate_provider_key(key_id: str):
    """Deactivate a provider key."""
    database.set_provider_key_active(key_id, False)
    return {"success": True, "message": "Provider key deactivated successfully"}


@router.post("/api/admin/provider-keys/{key_id}/label")
def update_provider_key_label_endpoint(key_id: str, request: UpdateAdminKeyLabelRequest):
    """Update the label for a provider key."""
    database.update_provider_key_label(key_id, request.label)
    return {"success": True, "message": "Provider key label updated successfully"}
