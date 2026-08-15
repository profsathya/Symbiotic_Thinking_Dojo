import logging
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional

from config import DATABASE_PATH, DATABASE_TYPE, LOG_DB_TIMINGS

logger = logging.getLogger(__name__)

_local = threading.local()


def _log_timing(label: str, started: float) -> None:
    """Record how long a database call took, when LOG_DB_TIMINGS is on."""
    if LOG_DB_TIMINGS:
        logger.info("db %.1fms %s", (time.perf_counter() - started) * 1000, label)

# PostgreSQL uses %s for placeholders, SQLite uses ?
_PH = "%s" if DATABASE_TYPE == "postgres" else "?"

# One-time backfill that files every pre-existing CTI key under a first course.
# Guarded by an admin_settings flag so repeated init_db() runs (every process
# start, in production) never re-create the course or re-assign keys.
COURSE_BACKFILL_FLAG = "course_backfill_v1"
COURSE_BACKFILL_NAME = "CST395 - Spring 2026"


def _serialize_datetime(value: Any) -> Any:
    """Convert datetime objects to ISO format strings."""
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _serialize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize datetime fields in a row to ISO format strings."""
    return {key: _serialize_datetime(value) for key, value in row.items()}

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
    github_key TEXT,
    course_id TEXT
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    term TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
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
    github_key TEXT,
    course_id TEXT
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    term TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
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

    @staticmethod
    def _label(sql: str) -> str:
        """First line of a statement, for timing logs."""
        return " ".join(sql.split())[:80]

    def execute(self, sql: str, params: tuple = ()) -> None:
        started = time.perf_counter()
        self._obj.execute(sql, params)
        _log_timing(self._label(sql), started)

    def execute_rowcount(self, sql: str, params: tuple = ()) -> int:
        """Execute a statement and return the number of affected rows."""
        started = time.perf_counter()
        try:
            if DATABASE_TYPE == "postgres":
                self._obj.execute(sql, params)
                return self._obj.rowcount
            return self._obj.execute(sql, params).rowcount
        finally:
            _log_timing(self._label(sql), started)

    def fetchone(self) -> Optional[Dict[str, Any]]:
        if DATABASE_TYPE == "postgres":
            row = self._obj.fetchone()
            return dict(row) if row else None
        # SQLite: last execute returned a cursor stored internally
        # We need to use the connection's last cursor
        raise NotImplementedError("Use query() for SELECTs")

    def query_one(self, sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        started = time.perf_counter()
        try:
            if DATABASE_TYPE == "postgres":
                self._obj.execute(sql, params)
                row = self._obj.fetchone()
                return _serialize_row(dict(row)) if row else None
            else:
                row = self._obj.execute(sql, params).fetchone()
                return _serialize_row(dict(row)) if row else None
        finally:
            _log_timing(self._label(sql), started)

    def query_all(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        started = time.perf_counter()
        try:
            if DATABASE_TYPE == "postgres":
                self._obj.execute(sql, params)
                return [_serialize_row(dict(r)) for r in self._obj.fetchall()]
            else:
                return [_serialize_row(dict(r)) for r in self._obj.execute(sql, params).fetchall()]
        finally:
            _log_timing(self._label(sql), started)


def _get_sqlite_conn() -> sqlite3.Connection:
    """Get a thread-local SQLite connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DATABASE_PATH)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
    return _local.conn


_pool = None
_pool_lock = threading.Lock()
_pool_slots: Optional[threading.Semaphore] = None


def _get_pool():
    """Lazily build the process-wide postgres connection pool.

    Built on first use rather than at import so that importing this module
    never reaches out to the network (tests, `compileall`, CLI tools).
    """
    global _pool, _pool_slots
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                from psycopg2 import pool as pg_pool

                from config import DATABASE_URL, DB_POOL_MAX, DB_POOL_MIN

                _pool_slots = threading.Semaphore(DB_POOL_MAX)
                _pool = pg_pool.ThreadedConnectionPool(DB_POOL_MIN, DB_POOL_MAX, DATABASE_URL)
                logger.info(
                    "Postgres connection pool created (min=%s, max=%s)", DB_POOL_MIN, DB_POOL_MAX
                )
    return _pool


def close_pool() -> None:
    """Close every pooled connection. Used on shutdown."""
    global _pool, _pool_slots
    with _pool_lock:
        if _pool is not None:
            _pool.closeall()
            _pool = None
            _pool_slots = None


@contextmanager
def _pooled_connection():
    """Check a live connection out of the pool and return it when done.

    psycopg2's ThreadedConnectionPool raises instead of waiting once it is
    exhausted, so a semaphore bounds callers first and makes them queue.
    A connection that errors is closed rather than handed to the next caller.
    """
    from config import DB_POOL_TIMEOUT

    pool = _get_pool()
    assert _pool_slots is not None
    if not _pool_slots.acquire(timeout=DB_POOL_TIMEOUT):
        raise TimeoutError(
            f"Timed out after {DB_POOL_TIMEOUT}s waiting for a database connection"
        )

    started = time.perf_counter()
    conn = None
    try:
        # Cloud SQL drops idle connections; skip past any the pool still holds.
        for _ in range(3):
            candidate = pool.getconn()
            if candidate.closed:
                pool.putconn(candidate, close=True)
                continue
            conn = candidate
            break
        if conn is None:
            raise RuntimeError("Could not obtain a live database connection from the pool")
        _log_timing("connection checkout", started)

        broken = False
        try:
            yield conn
        except Exception:
            try:
                conn.rollback()
            except Exception:
                broken = True
            raise
        finally:
            pool.putconn(conn, close=broken)
            conn = None
    finally:
        if conn is not None:
            pool.putconn(conn, close=True)
        _pool_slots.release()


@contextmanager
def get_db():
    """Context manager that yields a _DbWrapper for database operations."""
    if DATABASE_TYPE == "postgres":
        import psycopg2.extras

        with _pooled_connection() as conn:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            try:
                yield _DbWrapper(cursor)
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cursor.close()
    else:
        conn = _get_sqlite_conn()
        try:
            yield _DbWrapper(conn)
            conn.commit()
        except Exception:
            conn.rollback()
            raise


def _upsert_admin_setting(db: "_DbWrapper", key: str, value: str) -> None:
    """Write an admin setting using an existing connection.

    Takes the wrapper rather than opening its own so it can run inside
    init_db()'s transaction — on postgres a nested get_db() would be a second
    connection that cannot see this transaction's uncommitted DDL.
    """
    now = datetime.utcnow().isoformat()
    if DATABASE_TYPE == "postgres":
        db.execute(
            f"""
            INSERT INTO admin_settings (key, value, updated_at)
            VALUES ({_PH}, {_PH}, {_PH})
            ON CONFLICT (key) DO UPDATE SET value = {_PH}, updated_at = {_PH}
            """,
            (key, value, now, value, now),
        )
    else:
        db.execute(
            f"""
            INSERT OR REPLACE INTO admin_settings (key, value, updated_at)
            VALUES ({_PH}, {_PH}, {_PH})
            """,
            (key, value, now),
        )


def _backfill_courses(db: "_DbWrapper") -> None:
    """Assign every pre-existing CTI key to a first course, exactly once.

    No-op once the COURSE_BACKFILL_FLAG admin setting is present, so restarting
    the service does not create a duplicate course or re-file keys that an
    admin has since moved. Keys created after this runs get a course only when
    one is explicitly chosen.
    """
    flag = db.query_one(
        f"SELECT value FROM admin_settings WHERE key = {_PH}", (COURSE_BACKFILL_FLAG,)
    )
    if flag:
        return

    # `name` is unique — reuse a matching course rather than failing the insert
    # if one was created by hand before this migration ran.
    existing = db.query_one(
        f"SELECT id FROM courses WHERE name = {_PH}", (COURSE_BACKFILL_NAME,)
    )
    if existing:
        course_id = existing["id"]
    else:
        course_id = str(uuid.uuid4())
        db.execute(
            f"""
            INSERT INTO courses (id, name, term, active, created_at, notes)
            VALUES ({_PH}, {_PH}, NULL, TRUE, {_PH}, {_PH})
            """,
            (
                course_id,
                COURSE_BACKFILL_NAME,
                datetime.utcnow().isoformat(),
                "Created automatically when course organization was added.",
            ),
        )

    db.execute(
        f"UPDATE cti_keys SET course_id = {_PH} WHERE course_id IS NULL", (course_id,)
    )
    _upsert_admin_setting(db, COURSE_BACKFILL_FLAG, course_id)


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
            # Add provider key columns if they don't exist (for existing tables)
            for column in ['openai_key', 'anthropic_key', 'google_key', 'github_key']:
                try:
                    db.execute(f"ALTER TABLE cti_keys ADD COLUMN IF NOT EXISTS {column} TEXT")
                except:
                    pass
            # Add course_id column if it doesn't exist (for existing tables)
            try:
                db.execute("ALTER TABLE cti_keys ADD COLUMN IF NOT EXISTS course_id TEXT")
            except:
                pass
            # Create courses table if it doesn't exist
            try:
                db.execute("""
                CREATE TABLE IF NOT EXISTS courses (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    term TEXT,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )
                """)
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
            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                term TEXT,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
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
            # Add course_id column if it doesn't exist (for existing tables)
            try:
                db.execute("ALTER TABLE cti_keys ADD COLUMN course_id TEXT")
            except:
                pass

        # Both branches land here with `courses` and `cti_keys.course_id` in
        # place, so the one-time backfill is shared.
        _backfill_courses(db)


def get_key(key_id: str) -> Optional[Dict[str, Any]]:
    """Look up a CTI key by its ID."""
    with get_db() as db:
        row = db.query_one(f"SELECT * FROM cti_keys WHERE id = {_PH}", (key_id,))
        if row:
            return _serialize_row(row)
        return None


def reserve_budget(key_id: str, tokens: int) -> bool:
    """Atomically reserve tokens against a key's budget.

    Adds the reservation to used_tokens_output only if the whole reservation
    fits inside the remaining budget, in a single conditional UPDATE —
    concurrent requests cannot all slip past a stale read, and usage can
    never be pushed past total_budget_tokens. Returns True if reserved.
    """
    with get_db() as db:
        affected = db.execute_rowcount(
            f"""
            UPDATE cti_keys
            SET used_tokens_output = used_tokens_output + {_PH}
            WHERE id = {_PH}
              AND (used_tokens_input + used_tokens_output + {_PH}) <= total_budget_tokens
            """,
            (tokens, key_id, tokens),
        )
        return affected == 1


def release_budget(key_id: str, tokens: int) -> None:
    """Return a reservation made by reserve_budget (e.g. after an API failure)."""
    with get_db() as db:
        db.execute(
            f"UPDATE cti_keys SET used_tokens_output = used_tokens_output - {_PH} WHERE id = {_PH}",
            (tokens, key_id),
        )


def settle_usage(key_id: str, input_tokens: int, output_tokens: int, reserved_tokens: int) -> None:
    """Replace a reservation with actual token usage and update last_used_at."""
    with get_db() as db:
        db.execute(
            f"""
            UPDATE cti_keys
            SET used_tokens_input = used_tokens_input + {_PH},
                used_tokens_output = used_tokens_output + {_PH} - {_PH},
                last_used_at = {_PH}
            WHERE id = {_PH}
            """,
            (input_tokens, output_tokens, reserved_tokens, datetime.utcnow().isoformat(), key_id),
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
    course_id: Optional[str] = None,
) -> None:
    """Insert a new CTI key."""
    with get_db() as db:
        db.execute(
            f"""
            INSERT INTO cti_keys (id, student_email, student_name, total_budget_tokens, expires_at, notes, openai_key, anthropic_key, google_key, github_key, course_id)
            VALUES ({_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH})
            """,
            (key_id, student_email, student_name, total_budget_tokens, expires_at, notes, openai_key, anthropic_key, google_key, github_key, course_id),
        )


def create_keys(keys: List[Dict[str, Any]]) -> Dict[str, List]:
    """Insert many CTI keys over ONE connection and ONE transaction.

    Each entry must carry `key_id` and `student_email`; the rest of the
    create_key() arguments are optional. Returns
    `{"created": [row, ...], "failed": [{"index": i, "error": str}, ...]}`.

    A SAVEPOINT around each insert keeps the previous per-student error
    isolation: one bad row is rolled back on its own instead of aborting the
    batch (on postgres a failed statement would otherwise poison the whole
    transaction). The created rows are read back in a single SELECT rather
    than one per key.
    """
    created_ids: List[str] = []
    failed: List[Dict[str, Any]] = []
    if not keys:
        return {"created": [], "failed": []}

    with get_db() as db:
        for index, key in enumerate(keys):
            savepoint = f"sp_{index}"
            try:
                db.execute(f"SAVEPOINT {savepoint}")
                db.execute(
                    f"""
                    INSERT INTO cti_keys (id, student_email, student_name, total_budget_tokens, expires_at, notes, openai_key, anthropic_key, google_key, github_key, course_id)
                    VALUES ({_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH}, {_PH})
                    """,
                    (
                        key["key_id"],
                        key["student_email"],
                        key.get("student_name"),
                        key.get("total_budget_tokens", 5_000_000),
                        key.get("expires_at"),
                        key.get("notes"),
                        key.get("openai_key"),
                        key.get("anthropic_key"),
                        key.get("google_key"),
                        key.get("github_key"),
                        key.get("course_id"),
                    ),
                )
                db.execute(f"RELEASE SAVEPOINT {savepoint}")
                created_ids.append(key["key_id"])
            except Exception as exc:
                db.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
                failed.append({"index": index, "error": str(exc)})

        created: List[Dict[str, Any]] = []
        if created_ids:
            placeholders = ", ".join([_PH] * len(created_ids))
            created = db.query_all(
                f"SELECT * FROM cti_keys WHERE id IN ({placeholders})", tuple(created_ids)
            )
            # Return them in the order they were requested.
            by_id = {row["id"]: row for row in created}
            created = [by_id[key_id] for key_id in created_ids if key_id in by_id]

    return {"created": created, "failed": failed}


def set_key_active(key_id: str, active: bool) -> None:
    """Activate or deactivate a key."""
    with get_db() as db:
        db.execute(f"UPDATE cti_keys SET active = {_PH} WHERE id = {_PH}", (active, key_id))


def delete_key(key_id: str) -> None:
    """Delete a CTI key."""
    with get_db() as db:
        db.execute(f"DELETE FROM cti_keys WHERE id = {_PH}", (key_id,))


def add_budget(key_id: str, tokens: int) -> None:
    """Increase the total budget for a key."""
    with get_db() as db:
        db.execute(
            f"UPDATE cti_keys SET total_budget_tokens = total_budget_tokens + {_PH} WHERE id = {_PH}",
            (tokens, key_id),
        )


def set_budget(key_id: str, total_budget: int) -> None:
    """Set the total budget for a key to a specific value."""
    with get_db() as db:
        db.execute(
            f"UPDATE cti_keys SET total_budget_tokens = {_PH} WHERE id = {_PH}",
            (total_budget, key_id),
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
        _upsert_admin_setting(db, key, value)


def list_keys(
    active_only: bool = False,
    course_id: Optional[str] = None,
    unassigned_only: bool = False,
) -> List[Dict[str, Any]]:
    """List keys, optionally filtered to active-only and/or a single course.

    `unassigned_only` selects the keys that belong to no course and takes
    precedence over `course_id`.
    """
    with get_db() as db:
        conditions: List[str] = []
        params: List[Any] = []
        if active_only:
            conditions.append("active = TRUE")
        if unassigned_only:
            conditions.append("course_id IS NULL")
        elif course_id is not None:
            conditions.append(f"course_id = {_PH}")
            params.append(course_id)

        query = "SELECT * FROM cti_keys"
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY created_at DESC"
        rows = db.query_all(query, tuple(params))
        return [_serialize_row(row) for row in rows]


def set_key_course(key_id: str, course_id: Optional[str]) -> None:
    """Move a key into a course, or out of every course when course_id is None."""
    with get_db() as db:
        db.execute(
            f"UPDATE cti_keys SET course_id = {_PH} WHERE id = {_PH}", (course_id, key_id)
        )


# Course Management
def create_course(
    course_id: str,
    name: str,
    term: Optional[str] = None,
    notes: Optional[str] = None,
) -> None:
    """Insert a new course."""
    with get_db() as db:
        db.execute(
            f"""
            INSERT INTO courses (id, name, term, active, created_at, notes)
            VALUES ({_PH}, {_PH}, {_PH}, TRUE, {_PH}, {_PH})
            """,
            (course_id, name, term, datetime.utcnow().isoformat(), notes),
        )


def list_courses() -> List[Dict[str, Any]]:
    """List courses, each with its key count and total tokens used."""
    with get_db() as db:
        return db.query_all(
            """
            SELECT c.id, c.name, c.term, c.active, c.created_at, c.notes,
                   COUNT(k.id) AS key_count,
                   COALESCE(SUM(k.used_tokens_input + k.used_tokens_output), 0) AS total_used_tokens
            FROM courses c
            LEFT JOIN cti_keys k ON k.course_id = c.id
            GROUP BY c.id, c.name, c.term, c.active, c.created_at, c.notes
            ORDER BY c.name
            """
        )


def get_course(course_id: str) -> Optional[Dict[str, Any]]:
    """Look up a course by its ID."""
    with get_db() as db:
        return db.query_one(f"SELECT * FROM courses WHERE id = {_PH}", (course_id,))


def get_course_by_name(name: str) -> Optional[Dict[str, Any]]:
    """Look up a course by its (unique) name."""
    with get_db() as db:
        return db.query_one(f"SELECT * FROM courses WHERE name = {_PH}", (name,))


def update_course(
    course_id: str,
    name: Optional[str] = None,
    term: Optional[str] = None,
    notes: Optional[str] = None,
) -> None:
    """Update the supplied fields of a course; omitted fields are left alone."""
    assignments: List[str] = []
    params: List[Any] = []
    if name is not None:
        assignments.append(f"name = {_PH}")
        params.append(name)
    if term is not None:
        assignments.append(f"term = {_PH}")
        params.append(term)
    if notes is not None:
        assignments.append(f"notes = {_PH}")
        params.append(notes)
    if not assignments:
        return

    params.append(course_id)
    with get_db() as db:
        db.execute(
            f"UPDATE courses SET {', '.join(assignments)} WHERE id = {_PH}", tuple(params)
        )


def set_course_active(course_id: str, active: bool) -> None:
    """Activate or deactivate a course."""
    with get_db() as db:
        db.execute(f"UPDATE courses SET active = {_PH} WHERE id = {_PH}", (active, course_id))


def count_keys_in_course(course_id: str) -> int:
    """Count the CTI keys currently assigned to a course."""
    with get_db() as db:
        row = db.query_one(
            f"SELECT COUNT(*) AS key_count FROM cti_keys WHERE course_id = {_PH}", (course_id,)
        )
        return int(row["key_count"]) if row else 0


def delete_course(course_id: str) -> None:
    """Delete a course. Callers must check it holds no keys first."""
    with get_db() as db:
        db.execute(f"DELETE FROM courses WHERE id = {_PH}", (course_id,))


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


def get_provider_key_by_id(key_id: str) -> Optional[Dict[str, Any]]:
    """Get a provider key by its ID."""
    with get_db() as db:
        return db.query_one(f"SELECT * FROM provider_keys WHERE id = {_PH}", (key_id,))


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
