"""Tests for database connection handling and bulk-write cost.

    python3 backend/tests/test_db_performance.py

Guards the fix for the 2026-08-15 production incident, where a 50-student
bulk create opened 102 postgres connections — one TLS handshake per
create-then-read-back — and blocked the event loop while it did so.

The connection *count* is the portable assertion: sqlite reuses a
thread-local connection, so wall-clock here says nothing about Cloud SQL,
but every get_db() entry is one psycopg2.connect() in production.
"""

import contextlib
import os
import sys
import tempfile
import time
import uuid

_TMP_DIR = tempfile.mkdtemp(prefix="cti-perf-tests-")
DB_PATH = os.path.join(_TMP_DIR, "perf.db")
ADMIN_KEY = "perf-test-admin-key-at-least-32-characters"

os.environ["DATABASE_TYPE"] = "sqlite"
os.environ["DATABASE_PATH"] = DB_PATH
os.environ["ADMIN_API_KEY"] = ADMIN_KEY
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-not-a-real-key")

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import database  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)
AUTH = {"X-Admin-Key": ADMIN_KEY}

_failures: list = []
_passes = 0


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


@contextlib.contextmanager
def count_connections():
    """Count get_db() entries — one postgres connection each in production."""
    counter = {"n": 0}
    original = database.get_db

    @contextlib.contextmanager
    def counting():
        counter["n"] += 1
        with original() as db:
            yield db

    database.get_db = counting
    try:
        yield counter
    finally:
        database.get_db = original


def students(count: int, tag: str) -> list:
    return [{"email": f"{tag}-{i}-{uuid.uuid4().hex[:6]}@csumb.edu"} for i in range(count)]


database.init_db()


def test_bulk_create_50_is_fast_and_cheap():
    """50 keys: single-digit seconds, and a connection count that does not
    scale with the batch size."""
    started = time.perf_counter()
    with count_connections() as counter:
        res = client.post(
            "/api/admin/keys/bulk",
            headers=AUTH,
            json={"students": students(50, "bulk50"), "budget": 1000},
        )
    elapsed = time.perf_counter() - started

    check(res.status_code == 200, f"bulk create failed: {res.status_code} {res.text}")
    check(len(res.json()["created"]) == 50, f"expected 50 keys, got {len(res.json()['created'])}")
    check(elapsed < 9.0, f"bulk create of 50 took {elapsed:.2f}s, expected single-digit seconds")

    # Was 102 before the fix (2 per student + auth). The batch now costs one
    # connection regardless of size; the rest is the auth dependency.
    check(
        counter["n"] <= 6,
        f"bulk create opened {counter['n']} connections; it must not scale with batch size",
    )
    print(f"      50-key bulk create: {elapsed:.2f}s, {counter['n']} connections")


def test_connection_count_is_flat_across_batch_sizes():
    """The whole point of the fix: 10 keys and 100 keys cost the same."""
    with count_connections() as small:
        client.post(
            "/api/admin/keys/bulk",
            headers=AUTH,
            json={"students": students(10, "small"), "budget": 1000},
        )
    with count_connections() as large:
        client.post(
            "/api/admin/keys/bulk",
            headers=AUTH,
            json={"students": students(100, "large"), "budget": 1000},
        )
    check(
        small["n"] == large["n"],
        f"connection count scaled with batch size: 10 keys -> {small['n']}, "
        f"100 keys -> {large['n']}",
    )
    print(f"      10 keys: {small['n']} connections; 100 keys: {large['n']} connections")


def test_bulk_preserves_per_student_error_isolation():
    """One bad row must not take the batch down with it."""
    good = students(3, "iso")
    res = client.post(
        "/api/admin/keys/bulk",
        headers=AUTH,
        json={
            "students": good + [{"name": "No Email"}, {"email": "x@y.edu", "course_id": "nope"}],
            "budget": 1000,
        },
    )
    check(res.status_code == 200, f"bulk create failed: {res.text}")
    body = res.json()
    check(len(body["created"]) == 3, f"expected the 3 valid students, got {len(body['created'])}")
    check(len(body["failed"]) == 2, f"expected 2 failures, got {body['failed']}")
    errors = " ".join(f["error"] for f in body["failed"])
    check("Missing email" in errors, f"missing-email failure not reported: {errors}")
    check("Course not found" in errors, f"unknown-course failure not reported: {errors}")


def test_duplicate_id_rolls_back_only_that_row():
    """A failing INSERT must roll back to its savepoint, not the batch.

    On postgres a failed statement poisons the whole transaction unless it is
    wrapped in a savepoint, which would silently drop every other key.
    """
    duplicate_id = str(uuid.uuid4())
    database.create_key(key_id=duplicate_id, student_email="taken@csumb.edu")

    rows = [
        {"key_id": str(uuid.uuid4()), "student_email": "first@csumb.edu"},
        {"key_id": duplicate_id, "student_email": "clash@csumb.edu"},
        {"key_id": str(uuid.uuid4()), "student_email": "third@csumb.edu"},
    ]
    result = database.create_keys(rows)
    check(len(result["created"]) == 2, f"expected 2 survivors, got {len(result['created'])}")
    check(len(result["failed"]) == 1, f"expected 1 failure, got {result['failed']}")
    check(result["failed"][0]["index"] == 1, f"wrong row blamed: {result['failed']}")
    emails = {row["student_email"] for row in result["created"]}
    check(
        emails == {"first@csumb.edu", "third@csumb.edu"},
        f"the rows either side of the failure were lost: {emails}",
    )


def test_admin_routes_still_require_a_key():
    """The write-path changes must not have loosened auth."""
    routes = [
        ("GET", "/api/admin/keys", None),
        ("GET", "/api/admin/stats", None),
        ("GET", "/api/admin/usage", None),
        ("GET", "/api/admin/courses", None),
        ("POST", "/api/admin/courses", {"name": "Nope"}),
        ("POST", "/api/admin/keys", {"email": "no@auth.edu"}),
        ("POST", "/api/admin/keys/bulk", {"students": [{"email": "no@auth.edu"}], "budget": 1000}),
        ("DELETE", "/api/admin/keys/whatever", None),
    ]
    for method, path, body in routes:
        for headers, label in (({}, "no key"), ({"X-Admin-Key": "wrong"}, "wrong key")):
            res = client.request(method, path, headers=headers, json=body)
            check(
                res.status_code == 401,
                f"{method} {path} with {label} returned {res.status_code}, expected 401",
            )

    check(
        len(database.list_keys(course_id=None, unassigned_only=False)) > 0
        and not any(k["student_email"] == "no@auth.edu" for k in database.list_keys()),
        "an unauthenticated request created a key",
    )


def test_sync_routes_do_not_block_the_event_loop():
    """Admin handlers must be sync so Starlette runs them in a threadpool.

    As `async def`, their blocking psycopg2 calls ran on the event loop and
    stalled every other request on the instance for the length of a bulk write.
    """
    import inspect

    import router_admin

    offenders = [
        route.endpoint.__name__
        for route in router_admin.router.routes
        if inspect.iscoroutinefunction(route.endpoint)
    ]
    check(not offenders, f"these admin routes are async and will block the loop: {offenders}")
    check(
        not inspect.iscoroutinefunction(router_admin.verify_admin),
        "verify_admin is async and runs a blocking query on every admin request",
    )


class _StubCursor:
    def __init__(self, ping_fails: bool):
        self.ping_fails = ping_fails

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def execute(self, sql, params=()):
        if self.ping_fails:
            raise RuntimeError("server closed the connection unexpectedly")


class _StubConnection:
    def __init__(self, closed: int = 0, ping_fails: bool = False):
        self.closed = closed
        self.ping_fails = ping_fails
        self.rollbacks = 0

    def cursor(self, *args, **kwargs):
        return _StubCursor(self.ping_fails)

    def rollback(self):
        self.rollbacks += 1


class _StubPool:
    """Stands in for psycopg2's ThreadedConnectionPool."""

    def __init__(self, connections):
        self._queue = list(connections)
        self.returned = []      # (connection, close_flag)
        self.handed_out = []

    def getconn(self):
        conn = self._queue.pop(0)
        self.handed_out.append(conn)
        return conn

    def putconn(self, conn, close=False):
        self.returned.append((conn, close))


@contextlib.contextmanager
def stub_pool(connections):
    """Install a stub pool so the checkout logic can be tested without postgres."""
    import threading

    original_pool, original_slots = database._pool, database._pool_slots
    pool = _StubPool(connections)
    database._pool = pool
    database._pool_slots = threading.Semaphore(2)
    try:
        yield pool
    finally:
        database._pool = original_pool
        database._pool_slots = original_slots


def test_pool_returns_healthy_connections_and_discards_broken_ones():
    """A connection that errored must not be handed to the next caller."""
    healthy = _StubConnection()
    with stub_pool([healthy]) as pool:
        with database._pooled_connection() as conn:
            check(conn is healthy, "expected the pooled connection")
        check(pool.returned == [(healthy, False)], f"healthy conn not reused: {pool.returned}")

    # A live connection whose rollback succeeds is still reusable after an error.
    recoverable = _StubConnection()
    with stub_pool([recoverable]) as pool:
        try:
            with database._pooled_connection():
                raise ValueError("query blew up")
        except ValueError:
            pass
        # One rollback from the pre-ping, one from the failed transaction.
        check(recoverable.rollbacks == 2, "the failed transaction was not rolled back")
        check(pool.returned == [(recoverable, False)], f"unexpected disposal: {pool.returned}")

    # One that passes the pre-ping and then dies mid-use is not reusable: its
    # rollback fails too, so it must be closed rather than pooled.
    class _DeadConnection(_StubConnection):
        def rollback(self):
            self.rollbacks += 1
            if self.rollbacks > 1:  # the first is the pre-ping, which succeeds
                raise RuntimeError("connection is gone")

    dead = _DeadConnection()
    with stub_pool([dead]) as pool:
        try:
            with database._pooled_connection():
                raise ValueError("query blew up")
        except ValueError:
            pass
        check(pool.returned == [(dead, True)], f"dead conn was returned to the pool: {pool.returned}")


def test_pool_skips_connections_cloud_sql_already_closed():
    """Cloud SQL reaps idle connections; the pool may still hold them."""
    stale, live = _StubConnection(closed=1), _StubConnection()
    with stub_pool([stale, live]) as pool:
        with database._pooled_connection() as conn:
            check(conn is live, "checkout handed back a closed connection")
        check((stale, True) in pool.returned, "the stale connection was not discarded")
        check((live, False) in pool.returned, "the live connection was not returned to the pool")


def test_pool_discards_connections_that_look_open_but_are_dead():
    """The case `conn.closed` cannot catch.

    Cloud SQL reaping an idle session leaves psycopg2 reporting closed == 0
    until an operation fails, so checkout has to pre-ping rather than trust the
    flag. Without this the first request after an idle period 500s.
    """
    silently_dead = _StubConnection(closed=0, ping_fails=True)
    live = _StubConnection()
    with stub_pool([silently_dead, live]) as pool:
        with database._pooled_connection() as conn:
            check(conn is live, "checkout handed back a connection that fails on use")
        check(
            (silently_dead, True) in pool.returned,
            f"the dead-but-open-looking connection was pooled again: {pool.returned}",
        )
        check((live, False) in pool.returned, "the live connection was not returned")


def test_bulk_isolates_a_malformed_course_id():
    """An unhashable course_id must fail one student, not the whole request."""
    res = client.post(
        "/api/admin/keys/bulk",
        headers=AUTH,
        json={
            "students": [
                {"email": "fine-1@csumb.edu"},
                {"email": "broken@csumb.edu", "course_id": ["not", "a", "string"]},
                {"email": "fine-2@csumb.edu"},
            ],
            "budget": 1000,
        },
    )
    check(res.status_code == 200, f"malformed course_id returned {res.status_code}: {res.text}")
    body = res.json()
    check(len(body["created"]) == 2, f"valid students were lost: {len(body['created'])}")
    check(len(body["failed"]) == 1, f"expected exactly 1 failure, got {body['failed']}")
    check(
        body["failed"][0]["student"]["email"] == "broken@csumb.edu",
        f"wrong student blamed: {body['failed']}",
    )


def test_pool_slot_is_released_after_use():
    """Every checkout must release its semaphore slot, or the pool deadlocks."""
    with stub_pool([_StubConnection() for _ in range(5)]):
        for _ in range(5):
            with database._pooled_connection():
                pass
        # Two slots, five sequential checkouts — only possible if each released.
        check(database._pool_slots.acquire(blocking=False), "a pool slot leaked")
        database._pool_slots.release()


def main() -> int:
    global _passes
    tests = [
        test_bulk_create_50_is_fast_and_cheap,
        test_connection_count_is_flat_across_batch_sizes,
        test_bulk_preserves_per_student_error_isolation,
        test_duplicate_id_rolls_back_only_that_row,
        test_admin_routes_still_require_a_key,
        test_sync_routes_do_not_block_the_event_loop,
        test_pool_returns_healthy_connections_and_discards_broken_ones,
        test_pool_skips_connections_cloud_sql_already_closed,
        test_pool_discards_connections_that_look_open_but_are_dead,
        test_bulk_isolates_a_malformed_course_id,
        test_pool_slot_is_released_after_use,
    ]
    for test in tests:
        try:
            test()
        except Exception as exc:  # noqa: BLE001
            _failures.append((test.__name__, exc))
            print(f"FAIL  {test.__name__}: {exc}")
        else:
            _passes += 1
            print(f"ok    {test.__name__}")

    print(f"\n{_passes} passed, {len(_failures)} failed")
    return 1 if _failures else 0


if __name__ == "__main__":
    sys.exit(main())
