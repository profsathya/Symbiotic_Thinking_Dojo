import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional

from config import DATABASE_PATH, DATABASE_TYPE

_local = threading.local()

# PostgreSQL uses %s for placeholders, SQLite uses ?
_PH = "%s" if DATABASE_TYPE == "postgres" else "?"

CREATE_TABLE_SQL_SQLITE = """
CREATE TABLE IF NOT EXISTS cti_keys (
    id TEXT PRIMARY KEY,
    student_email TEXT NOT NULL,
    student_name TEXT,
    total_budget_tokens INTEGER NOT NULL DEFAULT 5000000,
    used_tokens_input INTEGER NOT NULL DEFAULT 0,
    used_tokens_output INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    last_used_at DATETIME,
    notes TEXT,
    label TEXT,
    openai_key TEXT,
    anthropic_key TEXT,
    google_key TEXT,
    github_key TEXT
);

CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_keys (
    id TEXT PRIMARY KEY,
    key_value TEXT NOT NULL UNIQUE,
    label TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS provider_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    key_value TEXT NOT NULL,
    label TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    notes TEXT
);
"""

CREATE_TABLE_SQL_POSTGRES = """
CREATE TABLE IF NOT EXISTS cti_keys (
    id TEXT PRIMARY KEY,
    student_email TEXT NOT NULL,
    student_name TEXT,
    total_budget_tokens INTEGER NOT NULL DEFAULT 5000000,
    used_tokens_input INTEGER NOT NULL DEFAULT 0,
    used_tokens_output INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    notes TEXT,
    label TEXT,
    openai_key TEXT,
    anthropic_key TEXT,
    google_key TEXT,
    github_key TEXT
);

CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_keys (
    id TEXT PRIMARY KEY,
    key_value TEXT NOT NULL UNIQUE,
    label TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS provider_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    key_value TEXT NOT NULL,
    label TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    notes TEXT
);
"""


class _DbWrapper:
    """Thin wrapper that normalizes SQLite connection and psycopg2 cursor APIs."""

    def __init__(self, obj: Any):
        self._obj = obj

    def execute(self, sql: str, params: tuple = ()) -> None:
        self._obj.execute(sql, params)

    def fetchone(self) -> Optional[Dict[str, Any]]:
        if DATABASE_TYPE == "postgres":
            row = self._obj.fetchone()
            return dict(row) if row else None
        # SQLite: last execute returned a cursor stored internally
        # We need to use the connection's last cursor
        raise NotImplementedError("Use query() for SELECTs")

    def query_one(self, sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        if DATABASE_TYPE == "postgres":
            self._obj.execute(sql, params)
            row = self._obj.fetchone()
            return dict(row) if row else None
        else:
            row = self._obj.execute(sql, params).fetchone()
            return dict(row) if row else None

    def query_all(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        if DATABASE_TYPE == "postgres":
            self._obj.execute(sql, params)
            return [dict(r) for r in self._obj.fetchall()]
        else:
            return [dict(r) for r in self._obj.execute(sql, params).fetchall()]


def _get_sqlite_conn() -> sqlite3.Connection:
    """Get a thread-local SQLite connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DATABASE_PATH)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
    return _local.conn


@contextmanager
def get_db():
    """Context manager that yields a _DbWrapper for database operations."""
    if DATABASE_TYPE == "postgres":
        import psycopg2
        import psycopg2.extras
        from config import DATABASE_URL

        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            yield _DbWrapper(cursor)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()
    else:
        conn = _get_sqlite_conn()
        try:
            yield _DbWrapper(conn)
            conn.commit()
        except Exception:
            conn.rollback()
            raise


def init_db() -> None:
    """Create tables if they don't exist."""
    with get_db() as db:
        if DATABASE_TYPE == "postgres":
            db.execute(CREATE_TABLE_SQL_POSTGRES)
            # Add label column if it doesn't exist
            try:
                db.execute("ALTER TABLE cti_keys ADD COLUMN IF NOT EXISTS label TEXT")
            except:
                pass
            # Create admin_keys table if it doesn't exist
            try:
                db.execute("""
                CREATE TABLE IF NOT EXISTS admin_keys (
                    id TEXT PRIMARY KEY,
                    key_value TEXT NOT NULL UNIQUE,
                    label TEXT,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used_at TIMESTAMP,
                    notes TEXT
                )
                """)
            except:
                pass
            # Create provider_keys table if it doesn't exist
            try:
                db.execute("""
                CREATE TABLE IF NOT EXISTS provider_keys (
                    id TEXT PRIMARY KEY,
                    provider TEXT NOT NULL,
                    key_value TEXT NOT NULL,
                    label TEXT,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used_at TIMESTAMP,
                    notes TEXT
                )
                """)
            except:
                pass
        else:
            # SQLite requires separate execute calls for multiple statements
            db.execute("""
            CREATE TABLE IF NOT EXISTS cti_keys (
                id TEXT PRIMARY KEY,
                student_email TEXT NOT NULL,
                student_name TEXT,
                total_budget_tokens INTEGER NOT NULL DEFAULT 5000000,
                used_tokens_input INTEGER NOT NULL DEFAULT 0,
                used_tokens_output INTEGER NOT NULL DEFAULT 0,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                last_used_at DATETIME,
                notes TEXT,
                label TEXT
            );
            """)
            db.execute("""
            CREATE TABLE IF NOT EXISTS admin_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            """)
            db.execute("""
            CREATE TABLE IF NOT EXISTS admin_keys (
                id TEXT PRIMARY KEY,
                key_value TEXT NOT NULL UNIQUE,
                label TEXT,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used_at DATETIME,
                notes TEXT
            );
            """)
            db.execute("""
            CREATE TABLE IF NOT EXISTS provider_keys (
                id TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                key_value TEXT NOT NULL,
                label TEXT,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used_at DATETIME,
                notes TEXT
            );
            """)
            # Add label column if it doesn't exist (for existing tables)
            try:
                db.execute("ALTER TABLE cti_keys ADD COLUMN label TEXT")
            except:
                pass
            # Add provider key columns if they don't exist (for existing tables)
            for column in ['openai_key', 'anthropic_key', 'google_key', 'github_key']:
                try:
                    db.execute(f"ALTER TABLE cti_keys ADD COLUMN {column} TEXT")
                except:
                    pass


def get_key(key_id: str) -> Optional[Dict[str, Any]]:
    """Look up a CTI key by its ID."""
    with get_db() as db:
        return db.query_one(f"SELECT * FROM cti_keys WHERE id = {_PH}", (key_id,))


def update_usage(key_id: str, input_tokens: int, output_tokens: int) -> None:
    """Increment token usage counters and update last_used_at."""
    with get_db() as db:
        db.execute(
            f"""
            UPDATE cti_keys
            SET used_tokens_input = used_tokens_input + {_PH},
                used_tokens_output = used_tokens_output + {_PH},
                last_used_at = {_PH}
            WHERE id = {_PH}
            """,
            (input_tokens, output_tokens, datetime.utcnow().isoformat(), key_id),
        )


def create_key(
    key_id: str,
    student_email: str,
    student_name: Optional[str] = None,
    total_budget_tokens: int = 5_000_000,
    expires_at: Optional[str] = None,
    notes: Optional[str] = None,
    openai_key: Optional[str] = None,
    anthropic_key: Optional[str] = None,
    google_key: Optional[str] = None,
    github_key: Optional[str] = None,
) -> None:
    """Insert a new CTI key."""
    with get_db() as db:
        db.execute(
            f"""
            INSERT INTO cti_keys (id, student_email, student_name, total_budget_tokens, expires_at, notes, openai_key, anthropic_key, google_key, github_key)
            VALUES ({_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH})
            """,
            (key_id, student_email, student_name, total_budget_tokens, expires_at, notes, openai_key, anthropic_key, google_key, github_key),
        )


def set_key_active(key_id: str, active: bool) -> None:
    """Activate or deactivate a key."""
    with get_db() as db:
        db.execute(f"UPDATE cti_keys SET active = {_PH} WHERE id = {_PH}", (active, key_id))


def add_budget(key_id: str, tokens: int) -> None:
    """Increase the total budget for a key."""
    with get_db() as db:
        db.execute(
            f"UPDATE cti_keys SET total_budget_tokens = total_budget_tokens + {_PH} WHERE id = {_PH}",
            (tokens, key_id),
        )


def update_key_label(key_id: str, label: str) -> None:
    """Update the label for a key."""
    with get_db() as db:
        db.execute(f"UPDATE cti_keys SET label = {_PH} WHERE id = {_PH}", (label, key_id))


def get_admin_setting(key: str) -> Optional[str]:
    """Get an admin setting value by key."""
    with get_db() as db:
        row = db.query_one(f"SELECT value FROM admin_settings WHERE key = {_PH}", (key,))
        return row["value"] if row else None


def set_admin_setting(key: str, value: str) -> None:
    """Set an admin setting value (insert or update)."""
    with get_db() as db:
        db.execute(
            f"""
            INSERT INTO admin_settings (key, value, updated_at)
            VALUES ({_PH}, {_PH}, {_PH})
            ON CONFLICT (key) DO UPDATE SET value = {_PH}, updated_at = {_PH}
            """
            if DATABASE_TYPE == "postgres"
            else f"""
            INSERT OR REPLACE INTO admin_settings (key, value, updated_at)
            VALUES ({_PH}, {_PH}, {_PH})
            """,
            (key, value, datetime.utcnow().isoformat(), value, datetime.utcnow().isoformat())
            if DATABASE_TYPE == "postgres"
            else (key, value, datetime.utcnow().isoformat()),
        )


def list_keys(active_only: bool = False) -> List[Dict[str, Any]]:
    """List all keys, optionally filtered to active-only."""
    with get_db() as db:
        query = "SELECT * FROM cti_keys"
        if active_only:
            query += " WHERE active = TRUE"
        query += " ORDER BY created_at DESC"
        return db.query_all(query)


def create_admin_key(key_id: str, key_value: str, label: Optional[str] = None, notes: Optional[str] = None) -> None:
    """Create a new admin key."""
    with get_db() as db:
        db.execute(
            f"""
            INSERT INTO admin_keys (id, key_value, label, active, created_at, notes)
            VALUES ({_PH}, {_PH}, {_PH}, TRUE, {_PH}, {_PH})
            """,
            (key_id, key_value, label, datetime.utcnow().isoformat(), notes),
        )


def get_admin_keys() -> List[Dict[str, Any]]:
    """Get all admin keys."""
    with get_db() as db:
        return db.query_all(f"SELECT * FROM admin_keys ORDER BY created_at DESC")


def validate_admin_key(key_value: str) -> Optional[Dict[str, Any]]:
    """Validate an admin key and return its details if valid and active."""
    with get_db() as db:
        key = db.query_one(
            f"SELECT * FROM admin_keys WHERE key_value = {_PH} AND active = TRUE",
            (key_value,),
        )
        if key:
            # Update last_used_at
            db.execute(
                f"UPDATE admin_keys SET last_used_at = {_PH} WHERE id = {_PH}",
                (datetime.utcnow().isoformat(), key["id"]),
            )
        return key


def delete_admin_key(key_id: str) -> None:
    """Delete an admin key."""
    with get_db() as db:
        db.execute(f"DELETE FROM admin_keys WHERE id = {_PH}", (key_id,))


def set_admin_key_active(key_id: str, active: bool) -> None:
    """Activate or deactivate an admin key."""
    with get_db() as db:
        db.execute(f"UPDATE admin_keys SET active = {_PH} WHERE id = {_PH}", (active, key_id))


def update_admin_key_label(key_id: str, label: str) -> None:
    """Update the label for an admin key."""
    with get_db() as db:
        db.execute(f"UPDATE admin_keys SET label = {_PH} WHERE id = {_PH}", (label, key_id))


# Provider Keys Management
def create_provider_key(key_id: str, provider: str, key_value: str, label: Optional[str] = None, notes: Optional[str] = None) -> None:
    """Create a new provider API key."""
    with get_db() as db:
        db.execute(
            f"""
            INSERT INTO provider_keys (id, provider, key_value, label, active, created_at, notes)
            VALUES ({_PH}, {_PH}, {_PH}, {_PH}, TRUE, {_PH}, {_PH})
            """,
            (key_id, provider, key_value, label, datetime.utcnow().isoformat(), notes),
        )


def get_provider_keys() -> List[Dict[str, Any]]:
    """Get all provider keys."""
    with get_db() as db:
        return db.query_all(f"SELECT * FROM provider_keys ORDER BY provider, created_at DESC")


def get_provider_keys_by_provider(provider: str) -> List[Dict[str, Any]]:
    """Get all provider keys for a specific provider."""
    with get_db() as db:
        return db.query_all(f"SELECT * FROM provider_keys WHERE provider = {_PH} AND active = TRUE ORDER BY created_at DESC", (provider,))


def get_active_provider_key(provider: str) -> Optional[Dict[str, Any]]:
    """Get an active provider key for a specific provider (round-robin or first available)."""
    with get_db() as db:
        keys = db.query_all(f"SELECT * FROM provider_keys WHERE provider = {_PH} AND active = TRUE ORDER BY last_used_at ASC LIMIT 1", (provider,))
        if keys:
            key = keys[0]
            # Update last_used_at
            db.execute(
                f"UPDATE provider_keys SET last_used_at = {_PH} WHERE id = {_PH}",
                (datetime.utcnow().isoformat(), key["id"]),
            )
            return key
        return None


def delete_provider_key(key_id: str) -> None:
    """Delete a provider key."""
    with get_db() as db:
        db.execute(f"DELETE FROM provider_keys WHERE id = {_PH}", (key_id,))


def set_provider_key_active(key_id: str, active: bool) -> None:
    """Activate or deactivate a provider key."""
    with get_db() as db:
        db.execute(f"UPDATE provider_keys SET active = {_PH} WHERE id = {_PH}", (active, key_id))


def update_provider_key_label(key_id: str, label: str) -> None:
    """Update the label for a provider key."""
    with get_db() as db:
        db.execute(f"UPDATE provider_keys SET label = {_PH} WHERE id = {_PH}", (label, key_id))


def get_student_provider_keys(key_id: str) -> Dict[str, Optional[str]]:
    """Get provider keys assigned to a specific student key."""
    with get_db() as db:
        key = db.query_one(f"SELECT openai_key, anthropic_key, google_key, github_key FROM cti_keys WHERE id = {_PH}", (key_id,))
        if key:
            return {
                'openai': key.get('openai_key'),
                'anthropic': key.get('anthropic_key'),
                'google': key.get('google_key'),
                'github': key.get('github_key'),
            }
        return {}
