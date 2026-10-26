"""Tests for SQLite audit storage and JSON export."""

import json
import sqlite3

import pytest

from backend import storage
from backend.evidence_loader import (
    DEFAULT_EVIDENCE_PATH,
    index_evidence,
    load_cases_from_file,
    load_evidence_from_file,
    resolve_case_evidence,
)
from backend.verifier import run_protected


@pytest.fixture
def c02():
    case = next(c for c in load_cases_from_file() if c.case_id == "C02")
    evidence = resolve_case_evidence(case, index_evidence(load_evidence_from_file(DEFAULT_EVIDENCE_PATH)))
    return case, evidence, run_protected(case.claim, evidence)


def test_save_and_export_roundtrip(isolated_db, c02):
    case, evidence, result = c02
    with storage.connect(isolated_db) as conn:
        storage.save_run(conn, result, case.claim, evidence)
    with storage.connect(isolated_db) as conn:
        record = json.loads(storage.export_run_json(conn, result.run_id))
    assert record["result"]["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert record["result"]["findings"] == json.loads(result.model_dump_json())["findings"]
    assert record["claim"]["case_id"] == "C02"
    assert [e["evidence_id"] for e in record["evidence"]] == ["ev-c02-sat"]
    assert record["synthetic_demo"] is True
    assert "Synthetic" in record["notice"]
    assert record["exported_at"]


def test_findings_rows_stored(isolated_db, c02):
    case, evidence, result = c02
    with storage.connect(isolated_db) as conn:
        storage.save_run(conn, result, case.claim, evidence)
        n = conn.execute("SELECT COUNT(*) FROM findings WHERE run_id = ?", (result.run_id,)).fetchone()[0]
    assert n == len(result.findings)


def test_unknown_run_id(isolated_db):
    with storage.connect(isolated_db) as conn, pytest.raises(storage.RunNotFoundError):
        storage.get_audit_record(conn, "nope")


def test_duplicate_run_id_rejected_and_rolled_back(isolated_db, c02):
    case, evidence, result = c02
    with storage.connect(isolated_db) as conn:
        storage.save_run(conn, result, case.claim, evidence)
    with pytest.raises(storage.StorageError):
        with storage.connect(isolated_db) as conn:
            storage.save_run(conn, result, case.claim, evidence)
    with storage.connect(isolated_db) as conn:
        assert len(storage.list_runs(conn)) == 1
        n = conn.execute("SELECT COUNT(*) FROM findings").fetchone()[0]
    assert n == len(result.findings)


def test_constraints_reject_bad_verdict(isolated_db):
    with storage.connect(isolated_db) as conn:
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute(
                "INSERT INTO runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ("r", "c", "protected", "PROBABLY", "", 0, "t", 1, "v", "{}", "{}", "[]"),
            )


def test_sql_is_parameterised_against_injection(isolated_db, c02):
    case, evidence, result = c02
    with storage.connect(isolated_db) as conn:
        storage.save_run(conn, result, case.claim, evidence)
        assert storage.list_runs(conn, case_id="C02' OR '1'='1") == []
        assert len(storage.list_runs(conn, case_id="C02")) == 1


def test_reset(isolated_db, c02):
    case, evidence, result = c02
    with storage.connect(isolated_db) as conn:
        storage.save_run(conn, result, case.claim, evidence)
        storage.reset(conn)
        assert storage.list_runs(conn) == []
