import os
from typing import Optional


# Anthropic API
ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")

# Model identifiers — update these when new model versions are released
SONNET_MODEL: str = os.environ.get("SONNET_MODEL", "claude-sonnet-4-5-20250929")
HAIKU_MODEL: str = os.environ.get("HAIKU_MODEL", "claude-haiku-4-5-20251001")

# Database
DATABASE_TYPE: str = os.environ.get("DATABASE_TYPE", "sqlite")  # "sqlite" or "postgres"
DATABASE_PATH: str = os.environ.get("DATABASE_PATH", "./cti_keys.db")
DATABASE_URL: str = os.environ.get("DATABASE_URL", "")  # For postgres

# CORS
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "https://symbioticthinking.ai,https://dojo.symbioticthinking.ai,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004"
    ).split(",")
    if origin.strip()
]

CORS_METHODS: list[str] = ["GET", "POST", "DELETE", "OPTIONS"]

# Rate limiting
RATE_LIMIT_REQUESTS: int = int(os.environ.get("RATE_LIMIT_REQUESTS", "10"))
RATE_LIMIT_WINDOW_SECONDS: int = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))

# Admin API
ADMIN_API_KEY: str = os.environ.get("ADMIN_API_KEY", "")

# Provider API Keys (fallback to environment variables)
OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
GITHUB_TOKEN: str = os.environ.get("GITHUB_TOKEN", "")

# Initialize database for admin settings
def get_admin_api_key() -> str:
    """Get admin API key from database or environment variable."""
    try:
        import database
        db_key = database.get_admin_setting("admin_api_key")
        if db_key:
            return db_key
    except:
        pass
    return ADMIN_API_KEY


def get_provider_api_key(provider: str, key_id: Optional[str] = None) -> str:
    """Get provider API key from student assignment, global pool, or environment variable."""
    try:
        import database
        # First check if student has a specific key assigned
        if key_id:
            student_keys = database.get_student_provider_keys(key_id)
            provider_key_id = student_keys.get(provider)
            if provider_key_id:
                # Look up the actual key value from the provider_keys table
                provider_key = database.get_provider_key_by_id(provider_key_id)
                if provider_key:
                    return provider_key['key_value']

        # Then check global provider key pool
        provider_key = database.get_active_provider_key(provider)
        if provider_key:
            return provider_key['key_value']
    except:
        pass

    # Fallback to environment variables
    if provider == 'openai':
        return OPENAI_API_KEY
    elif provider == 'google':
        return GOOGLE_API_KEY
    elif provider == 'github':
        return GITHUB_TOKEN
    elif provider == 'anthropic':
        return ANTHROPIC_API_KEY
    return ""
