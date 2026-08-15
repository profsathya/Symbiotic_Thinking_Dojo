"""Tests for course organization of CTI keys.

Runs the real FastAPI app against a throwaway SQLite database:

    python3 backend/tests/test_courses.py

Deliberately no pytest dependency — backend/requirements.txt has none, and CI
only compiles the backend, so this has to be runnable with a bare interpreter.
Test functions are still named `test_*` so `pytest backend/tests` works too.
"""

import os
import sqlite3
import sys
import tempfile
import uuid

# config.py and database.py read these at import time, so they must be set
# before the backend modules are imported.
_TMP_DIR = tempfile.mkdtemp(prefix="cti-course-tests-")
DB_PATH = os.path.join(_TMP_DIR, "test_cti_keys.db")
ADMIN_KEY = "test-admin-key-that-is-at-least-32-characters-long"

os.environ["DATABASE_TYPE"] = "sqlite"
os.environ["DATABASE_PATH"] = DB_PATH
os.environ["ADMIN_API_KEY"] = ADMIN_KEY
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-not-a-real-key")

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

LEGACY_KEY_IDS = [str(uuid.uuid4()) for _ in range(3)]


def seed_pre_migration_database() -> None:
    """Write a cti_keys table shaped like production *before* this feature.

    No `course_id` column and no provider-key columns, with rows in it — the
    state init_db() has to migrate forward without losing anything.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE cti_keys (
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
        )
        """
    )
    for index, key_id in enumerate(LEGACY_KEY_IDS):
        conn.execute(
            "INSERT INTO cti_keys (id, student_email, student_name, used_tokens_input,"
            " used_tokens_output) VALUES (?, ?, ?, ?, ?)",
            (key_id, f"legacy{index}@csumb.edu", f"Legacy Student {index}", 100, 200),
        )
    conn.commit()
    conn.close()


seed_pre_migration_database()

import database  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402
from router_admin import KeyResponse  # noqa: E402

client = TestClient(app)
AUTH = {"X-Admin-Key": ADMIN_KEY}

_failures: list = []
_passes = 0


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def raw_query(sql: str, params: tuple = ()) -> list:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        return [dict(row) for row in conn.execute(sql, params).fetchall()]
    finally:
        conn.close()


# --------------------------------------------------------------------------
# Schema migration + one-time backfill
# --------------------------------------------------------------------------
def test_init_db_migrates_and_backfills():
    """A pre-migration database gains the new column, table, and course."""
    database.init_db()

    columns = {row["name"] for row in raw_query("PRAGMA table_info(cti_keys)")}
    check("course_id" in columns, "cti_keys.course_id was not added by init_db()")

    tables = {row["name"] for row in raw_query("SELECT name FROM sqlite_master WHERE type='table'")}
    check("courses" in tables, "courses table was not created by init_db()")

    courses = raw_query("SELECT * FROM courses")
    check(len(courses) == 1, f"expected exactly 1 backfill course, got {len(courses)}")
    check(
        courses[0]["name"] == "CST395 - Spring 2026",
        f"unexpected backfill course name: {courses[0]['name']!r}",
    )
    check(bool(courses[0]["active"]), "backfill course should be active")

    assigned = raw_query(
        "SELECT id FROM cti_keys WHERE course_id = ?", (courses[0]["id"],)
    )
    check(
        {row["id"] for row in assigned} == set(LEGACY_KEY_IDS),
        "backfill did not assign every pre-existing key to the course",
    )

    flag = raw_query("SELECT value FROM admin_settings WHERE key = 'course_backfill_v1'")
    check(len(flag) == 1, "course_backfill_v1 flag was not set")


def test_fresh_database_initializes():
    """init_db() on an empty database — the path a new deployment takes.

    Runs in a subprocess because DATABASE_PATH is read at import time.
    """
    import subprocess

    fresh_path = os.path.join(_TMP_DIR, "fresh.db")
    script = (
        "import database;"
        " database.init_db();"
        " database.init_db();"
        " courses = database.list_courses();"
        " print(len(courses), courses[0]['name'] if courses else '')"
    )
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."),
        env={**os.environ, "DATABASE_PATH": fresh_path},
        capture_output=True,
        text=True,
    )
    check(result.returncode == 0, f"init_db() on a fresh database failed: {result.stderr}")
    check(
        result.stdout.strip() == "1 CST395 - Spring 2026",
        f"unexpected fresh-database state: {result.stdout.strip()!r}",
    )


def test_init_db_is_idempotent():
    """A second init_db() run must not duplicate or re-assign anything."""
    courses_before = raw_query("SELECT * FROM courses ORDER BY id")
    keys_before = raw_query("SELECT id, course_id FROM cti_keys ORDER BY id")
    flag_before = raw_query("SELECT value FROM admin_settings WHERE key = 'course_backfill_v1'")

    # Move one key out of the course, the way an admin would, to prove a rerun
    # does not silently re-file it.
    database.set_key_course(LEGACY_KEY_IDS[0], None)

    database.init_db()
    database.init_db()

    courses_after = raw_query("SELECT * FROM courses ORDER BY id")
    check(
        courses_after == courses_before,
        f"courses changed across reruns: {courses_before} -> {courses_after}",
    )
    check(
        raw_query("SELECT value FROM admin_settings WHERE key = 'course_backfill_v1'")
        == flag_before,
        "backfill flag changed on rerun",
    )

    moved = raw_query("SELECT course_id FROM cti_keys WHERE id = ?", (LEGACY_KEY_IDS[0],))
    check(moved[0]["course_id"] is None, "rerun re-assigned a key that was moved out")

    still_assigned = raw_query(
        "SELECT id, course_id FROM cti_keys WHERE id IN (?, ?) ORDER BY id",
        (LEGACY_KEY_IDS[1], LEGACY_KEY_IDS[2]),
    )
    check(
        all(row["course_id"] == courses_before[0]["id"] for row in still_assigned),
        "rerun changed the course of already-assigned keys",
    )
    check(len(keys_before) == 3, "sanity: three legacy keys were seeded")

    # Put it back so later tests see the backfilled state.
    database.set_key_course(LEGACY_KEY_IDS[0], courses_before[0]["id"])


# --------------------------------------------------------------------------
# Response-model tolerance for old production rows
# --------------------------------------------------------------------------
def test_key_response_accepts_pre_migration_row():
    """A row from before the migration has no course_id — it must still validate.

    Missing Optional defaults are what turn an old row into a 500 at response
    time, so this asserts on the model directly as well as through the route.
    """
    legacy_row = {
        "id": "11111111-2222-3333-4444-555555555555",
        "student_email": "old@csumb.edu",
        "student_name": None,
        "total_budget_tokens": 5_000_000,
        "used_tokens_input": 10,
        "used_tokens_output": 20,
        "active": True,
        "created_at": "2026-01-01T00:00:00",
        "expires_at": None,
        "last_used_at": None,
        "notes": None,
    }
    model = KeyResponse.model_validate(legacy_row)
    check(model.course_id is None, "course_id should default to None on an old row")
    check(model.openai_key is None, "provider keys should default to None on an old row")

    # And end to end: listing the seeded legacy keys must not 500.
    res = client.get("/api/admin/keys", headers=AUTH)
    check(res.status_code == 200, f"GET /api/admin/keys returned {res.status_code}: {res.text}")
    check(len(res.json()) >= 3, "expected the seeded legacy keys in the listing")


# --------------------------------------------------------------------------
# Auth gating on every new route
# --------------------------------------------------------------------------
def test_new_routes_require_admin_key():
    """No key and a wrong key must both be rejected on every new route."""
    course_id = str(uuid.uuid4())
    key_id = LEGACY_KEY_IDS[0]
    new_routes = [
        ("GET", "/api/admin/courses", None),
        ("POST", "/api/admin/courses", {"name": "Should Not Be Created"}),
        ("POST", f"/api/admin/courses/{course_id}", {"name": "Nope"}),
        ("POST", f"/api/admin/courses/{course_id}/deactivate", None),
        ("POST", f"/api/admin/courses/{course_id}/reactivate", None),
        ("DELETE", f"/api/admin/courses/{course_id}", None),
        ("POST", f"/api/admin/keys/{key_id}/course", {"course_id": None}),
        # Existing routes that grew a course_id parameter.
        ("GET", "/api/admin/keys?course_id=none", None),
        ("GET", f"/api/admin/stats?course_id={course_id}", None),
        ("GET", f"/api/admin/usage?course_id={course_id}", None),
    ]

    for method, path, body in new_routes:
        for headers, label in (
            ({}, "no X-Admin-Key"),
            ({"X-Admin-Key": "wrong-key"}, "wrong X-Admin-Key"),
        ):
            res = client.request(method, path, headers=headers, json=body)
            check(
                res.status_code == 401,
                f"{method} {path} with {label} returned {res.status_code}, expected 401",
            )

    check(
        len(raw_query("SELECT * FROM courses WHERE name = 'Should Not Be Created'")) == 0,
        "an unauthenticated request created a course",
    )


# --------------------------------------------------------------------------
# Course CRUD
# --------------------------------------------------------------------------
def test_course_crud_and_key_moves():
    listed = client.get("/api/admin/courses", headers=AUTH)
    check(listed.status_code == 200, f"list courses failed: {listed.text}")
    backfill = listed.json()[0]
    check(backfill["key_count"] == 3, f"expected 3 keys on the backfill course, got {backfill}")
    check(
        backfill["total_used_tokens"] == 900,
        f"expected 900 total used tokens (3 x 300), got {backfill['total_used_tokens']}",
    )

    created = client.post(
        "/api/admin/courses",
        headers=AUTH,
        json={"name": "CST438 - Fall 2026", "term": "Fall 2026", "notes": "Software Engineering"},
    )
    check(created.status_code == 201, f"create course failed: {created.text}")
    course = created.json()
    check(course["key_count"] == 0, "a brand new course should hold no keys")
    check(course["term"] == "Fall 2026", "term was not stored")

    duplicate = client.post("/api/admin/courses", headers=AUTH, json={"name": "CST438 - Fall 2026"})
    check(duplicate.status_code == 409, f"duplicate name should be 409, got {duplicate.status_code}")

    renamed = client.post(
        f"/api/admin/courses/{course['id']}", headers=AUTH, json={"name": "CST438 - Fall 2026 (S1)"}
    )
    check(renamed.status_code == 200, f"rename failed: {renamed.text}")
    check(renamed.json()["name"] == "CST438 - Fall 2026 (S1)", "rename did not apply")
    check(renamed.json()["term"] == "Fall 2026", "rename cleared an untouched field")

    clash = client.post(
        f"/api/admin/courses/{course['id']}", headers=AUTH, json={"name": "CST395 - Spring 2026"}
    )
    check(clash.status_code == 409, f"renaming onto an existing name should be 409, got {clash.status_code}")

    missing = client.post("/api/admin/courses/does-not-exist", headers=AUTH, json={"name": "x"})
    check(missing.status_code == 404, f"unknown course should be 404, got {missing.status_code}")

    # Move a key between courses, then out of every course.
    key_id = LEGACY_KEY_IDS[0]
    moved = client.post(
        f"/api/admin/keys/{key_id}/course", headers=AUTH, json={"course_id": course["id"]}
    )
    check(moved.status_code == 200, f"move to course failed: {moved.text}")
    check(
        database.get_key(key_id)["course_id"] == course["id"],
        "key was not moved into the target course",
    )

    delete_blocked = client.delete(f"/api/admin/courses/{course['id']}", headers=AUTH)
    check(
        delete_blocked.status_code == 400,
        f"deleting a course with keys should be 400, got {delete_blocked.status_code}",
    )

    unassigned = client.post(
        f"/api/admin/keys/{key_id}/course", headers=AUTH, json={"course_id": None}
    )
    check(unassigned.status_code == 200, f"move out of course failed: {unassigned.text}")
    check(database.get_key(key_id)["course_id"] is None, "key was not removed from its course")

    bad_target = client.post(
        f"/api/admin/keys/{key_id}/course", headers=AUTH, json={"course_id": "nope"}
    )
    check(bad_target.status_code == 404, f"unknown course target should be 404, got {bad_target.status_code}")

    bad_key = client.post(
        "/api/admin/keys/not-a-key/course", headers=AUTH, json={"course_id": None}
    )
    check(bad_key.status_code == 404, f"unknown key should be 404, got {bad_key.status_code}")

    deactivated = client.post(f"/api/admin/courses/{course['id']}/deactivate", headers=AUTH)
    check(deactivated.status_code == 200, f"deactivate failed: {deactivated.text}")
    check(database.get_course(course["id"])["active"] == 0, "course was not deactivated")

    reactivated = client.post(f"/api/admin/courses/{course['id']}/reactivate", headers=AUTH)
    check(reactivated.status_code == 200, f"reactivate failed: {reactivated.text}")
    check(bool(database.get_course(course["id"])["active"]), "course was not reactivated")

    deleted = client.delete(f"/api/admin/courses/{course['id']}", headers=AUTH)
    check(deleted.status_code == 200, f"delete of an empty course failed: {deleted.text}")
    check(database.get_course(course["id"]) is None, "course row survived deletion")


# --------------------------------------------------------------------------
# Course-aware key creation, filtering, and stats
# --------------------------------------------------------------------------
def test_create_and_filter_by_course():
    course = client.post(
        "/api/admin/courses", headers=AUTH, json={"name": "CST300 - Summer 2026"}
    ).json()

    single = client.post(
        "/api/admin/keys",
        headers=AUTH,
        json={"email": "new@csumb.edu", "budget": 1000, "course_id": course["id"]},
    )
    check(single.status_code == 201, f"create key failed: {single.text}")
    check(single.json()["course_id"] == course["id"], "created key did not land in the course")

    no_course = client.post(
        "/api/admin/keys", headers=AUTH, json={"email": "loner@csumb.edu", "budget": 1000}
    )
    check(no_course.status_code == 201, f"create key without course failed: {no_course.text}")
    check(no_course.json()["course_id"] is None, "a key created without a course must have none")

    bad_course = client.post(
        "/api/admin/keys",
        headers=AUTH,
        json={"email": "bad@csumb.edu", "course_id": "does-not-exist"},
    )
    check(bad_course.status_code == 404, f"unknown course on create should be 404, got {bad_course.status_code}")

    bulk = client.post(
        "/api/admin/keys/bulk",
        headers=AUTH,
        json={
            "students": [{"email": "b1@csumb.edu"}, {"email": "b2@csumb.edu", "name": "B Two"}],
            "budget": 2000,
            "course_id": course["id"],
        },
    )
    check(bulk.status_code == 200, f"bulk create failed: {bulk.text}")
    check(len(bulk.json()["created"]) == 2, "bulk create should have created two keys")
    check(
        all(k["course_id"] == course["id"] for k in bulk.json()["created"]),
        "bulk-created keys did not land in the course",
    )

    filtered = client.get(f"/api/admin/keys?course_id={course['id']}", headers=AUTH)
    check(filtered.status_code == 200, f"filtered listing failed: {filtered.text}")
    check(len(filtered.json()) == 3, f"expected 3 keys in the course, got {len(filtered.json())}")

    unassigned = client.get("/api/admin/keys?course_id=none", headers=AUTH)
    emails = {k["student_email"] for k in unassigned.json()}
    check("loner@csumb.edu" in emails, "the no-course filter missed an unassigned key")
    check(
        all(k["course_id"] is None for k in unassigned.json()),
        "the no-course filter returned assigned keys",
    )

    everything = client.get("/api/admin/keys", headers=AUTH)
    check(
        len(everything.json()) > len(filtered.json()),
        "an unfiltered listing should be larger than a single course",
    )

    # Stats follow the same filter.
    all_stats = client.get("/api/admin/stats", headers=AUTH).json()
    course_stats = client.get(f"/api/admin/stats?course_id={course['id']}", headers=AUTH).json()
    check(course_stats["total_keys"] == 3, f"course stats key count wrong: {course_stats}")
    check(
        course_stats["total_budget"] == 1000 + 2000 + 2000,
        f"course stats budget wrong: {course_stats}",
    )
    check(
        all_stats["total_keys"] > course_stats["total_keys"],
        "unfiltered stats should cover more keys than one course",
    )

    none_stats = client.get("/api/admin/stats?course_id=none", headers=AUTH).json()
    check(none_stats["total_keys"] >= 1, f"no-course stats should count the unassigned key: {none_stats}")

    usage = client.get(f"/api/admin/usage?course_id={course['id']}", headers=AUTH).json()
    check(len(usage["data"]) == 3, "usage export did not honour the course filter")
    check(
        all(row["course"] == "CST300 - Summer 2026" for row in usage["data"]),
        "usage export is missing the course name",
    )


def main() -> int:
    global _passes
    tests = [
        test_init_db_migrates_and_backfills,
        test_fresh_database_initializes,
        test_init_db_is_idempotent,
        test_key_response_accepts_pre_migration_row,
        test_new_routes_require_admin_key,
        test_course_crud_and_key_moves,
        test_create_and_filter_by_course,
    ]
    for test in tests:
        try:
            test()
        except Exception as exc:  # noqa: BLE001 — report every failure, not just the first
            _failures.append((test.__name__, exc))
            print(f"FAIL  {test.__name__}: {exc}")
        else:
            _passes += 1
            print(f"ok    {test.__name__}")

    print(f"\n{_passes} passed, {len(_failures)} failed  (db: {DB_PATH})")
    return 1 if _failures else 0


if __name__ == "__main__":
    sys.exit(main())
