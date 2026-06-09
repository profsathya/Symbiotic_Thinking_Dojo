import os


# Anthropic API
ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")

# Model identifiers — update these when new model versions are released.
# Use Anthropic's aliases so deployments don't break when a dated snapshot retires.
SONNET_MODEL: str = os.environ.get("SONNET_MODEL", "claude-sonnet-4-6")
HAIKU_MODEL: str = os.environ.get("HAIKU_MODEL", "claude-haiku-4-5")

# Database
DATABASE_TYPE: str = os.environ.get("DATABASE_TYPE", "sqlite")  # "sqlite" or "postgres"
DATABASE_PATH: str = os.environ.get("DATABASE_PATH", "./cti_keys.db")
DATABASE_URL: str = os.environ.get("DATABASE_URL", "")  # For postgres

# CORS
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "https://symbioticthinking.ai,https://dojo.symbioticthinking.ai,http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]

# Rate limiting
RATE_LIMIT_REQUESTS: int = int(os.environ.get("RATE_LIMIT_REQUESTS", "1000"))
RATE_LIMIT_WINDOW_SECONDS: int = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))
