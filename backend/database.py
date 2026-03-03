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
        sql = CREATE_TABLE_SQL_POSTGRES if DATABASE_TYPE == "postgres" else CREATE_TABLE_SQL_SQLITE
        db.execute(sql)


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
) -> None:
    """Insert a new CTI key."""
    with get_db() as db:
        db.execute(
            f"""
            INSERT INTO cti_keys (id, student_email, student_name, total_budget_tokens, expires_at, notes)
            VALUES ({_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH})
            """,
            (key_id, student_email, student_name, total_budget_tokens, expires_at, notes),
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


def list_keys(active_only: bool = False) -> List[Dict[str, Any]]:
    """List all keys, optionally filtered to active-only."""
    with get_db() as db:
        query = "SELECT * FROM cti_keys"
        if active_only:
            query += " WHERE active = TRUE"
        query += " ORDER BY created_at DESC"
        return db.query_all(query)
