"""SQLite audit storage. Parameterised SQL only. No secrets are ever stored."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Union

from backend import __version__
from backend.schemas import Claim, Evidence, RunResult

SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    run_id         TEXT PRIMARY KEY,
    case_id        TEXT NOT NULL,
    mode           TEXT NOT NULL CHECK (mode IN ('baseline', 'protected')),
    verdict        TEXT NOT NULL CHECK (verdict IN ('SUPPORTED', 'REFUTED', 'INSUFFICIENT_EVIDENCE', 'NEEDS_REVIEW')),
    explanation    TEXT,
    elapsed_ms     REAL NOT NULL CHECK (elapsed_ms >= 0),
    timestamp      TEXT NOT NULL,
    synthetic_demo INTEGER NOT NULL CHECK (synthetic_demo IN (0, 1)),
    code_version   TEXT NOT NULL,
    result_json    TEXT NOT NULL,
    claim_json     TEXT NOT NULL,
    evidence_json  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS findings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id            TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
    check_name        TEXT NOT NULL,
    code              TEXT NOT NULL,
    status            TEXT NOT NULL,
    severity          TEXT NOT NULL,
    evidence_ids_json TEXT NOT NULL,
    explanation       TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS benchmarks (
    benchmark_id TEXT PRIMARY KEY,
    created_at   TEXT NOT NULL,
    code_version TEXT NOT NULL,
    report_json  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_runs_case ON runs(case_id);
"""


class StorageError(Exception):
    """Raised when an audit record cannot be stored or read."""


class RunNotFoundError(KeyError):
    """Raised when a run_id is not in the audit store."""


@contextmanager
def connect(db_path: Union[str, Path]) -> Iterator[sqlite3.Connection]:
    """Open the audit database, create tables if needed, commit on success, roll back on error."""
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript(SCHEMA)
        yield conn
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        raise StorageError(f"Audit database error ({path}): {e}") from e
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def save_run(conn: sqlite3.Connection, result: RunResult, claim: Claim, evidence: List[Evidence]) -> None:
    """Store a run, its findings, and the exact claim/evidence snapshot it was run on."""
    conn.execute(
        "INSERT INTO runs (run_id, case_id, mode, verdict, explanation, elapsed_ms, timestamp, "
        "synthetic_demo, code_version, result_json, claim_json, evidence_json) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            result.run_id, result.case_id, result.mode, result.verdict.value, result.explanation,
            result.elapsed_ms, result.timestamp.isoformat(), int(result.synthetic_demo), __version__,
            result.model_dump_json(), claim.model_dump_json(),
            json.dumps([e.model_dump(mode="json") for e in evidence]),
        ),
    )
    conn.executemany(
        "INSERT INTO findings (run_id, check_name, code, status, severity, evidence_ids_json, explanation) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (result.run_id, f.check_name, f.code, f.status.value, f.severity.value,
             json.dumps(f.evidence_ids), f.explanation)
            for f in result.findings
        ],
    )


def get_audit_record(conn: sqlite3.Connection, run_id: str) -> Dict[str, Any]:
    """Return the full audit record for a run: result, claim and evidence snapshot, versions."""
    row = conn.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,)).fetchone()
    if row is None:
        raise RunNotFoundError(f"Unknown run_id: '{run_id}'")
    return {
        "run_id": row["run_id"],
        "code_version": row["code_version"],
        "synthetic_demo": bool(row["synthetic_demo"]),
        "notice": "Synthetic demonstration data. Not a statement about real-world events."
        if row["synthetic_demo"] else "Contains non-synthetic data.",
        "result": json.loads(row["result_json"]),
        "claim": json.loads(row["claim_json"]),
        "evidence": json.loads(row["evidence_json"]),
    }


def export_run_json(conn: sqlite3.Connection, run_id: str) -> str:
    """Audit record as a JSON string, stamped with export time."""
    record = get_audit_record(conn, run_id)
    record["exported_at"] = datetime.now(timezone.utc).isoformat()
    return json.dumps(record, indent=2)


def list_runs(conn: sqlite3.Connection, case_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Most recent runs first: [{run_id, case_id, mode, verdict, elapsed_ms, timestamp}]."""
    sql = "SELECT run_id, case_id, mode, verdict, elapsed_ms, timestamp FROM runs"
    params: tuple = ()
    if case_id is not None:
        sql += " WHERE case_id = ?"
        params = (case_id,)
    sql += " ORDER BY timestamp DESC LIMIT ?"
    return [dict(r) for r in conn.execute(sql, params + (int(limit),)).fetchall()]


def save_benchmark(conn: sqlite3.Connection, benchmark_id: str, report: Dict[str, Any]) -> None:
    """Store a benchmark report."""
    conn.execute(
        "INSERT INTO benchmarks (benchmark_id, created_at, code_version, report_json) VALUES (?, ?, ?, ?)",
        (benchmark_id, datetime.now(timezone.utc).isoformat(), __version__, json.dumps(report)),
    )


def reset(conn: sqlite3.Connection) -> None:
    """Delete all audit records (demo reset)."""
    conn.execute("DELETE FROM findings")
    conn.execute("DELETE FROM runs")
    conn.execute("DELETE FROM benchmarks")
