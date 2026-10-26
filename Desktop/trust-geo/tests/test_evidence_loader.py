"""Tests for JSON evidence and claim loading, parsing and validation diagnostics."""

from pathlib import Path
import pytest

from backend.evidence_loader import (
    EvidenceLoadError,
    ClaimLoadError,
    load_evidence_from_file,
    load_evidence_from_json,
    load_claims_from_file,
)


def test_load_valid_evidence_json_string():
    json_data = """
    [
        {
            "evidence_id": "test-ev-1",
            "source_type": "satellite",
            "source_id": "TEST-SAT-1",
            "acquired_at": "2026-10-20T10:00:00Z",
            "published_at": "2026-10-20T12:00:00Z",
            "content": "Test observation text",
            "metadata": {"platform": "Sentinel-2"},
            "is_synthetic": true
        }
    ]
    """
    evidence = load_evidence_from_json(json_data)
    assert len(evidence) == 1
    assert evidence[0].evidence_id == "test-ev-1"
    assert evidence[0].is_synthetic is True
    assert evidence[0].acquired_at is not None


def test_load_evidence_from_fixture_file():
    fixture_path = Path("data/synthetic_evidence.json")
    assert fixture_path.exists(), "Synthetic evidence fixture file should exist"
    evidence_list = load_evidence_from_file(fixture_path)
    assert len(evidence_list) == 5
    for item in evidence_list:
        assert item.is_synthetic is True
        assert item.evidence_id.startswith("ev-")


def test_load_claims_from_fixture_file():
    claims_path = Path("data/test_cases.json")
    assert claims_path.exists(), "Claims fixture file should exist"
    claims = load_claims_from_file(claims_path)
    assert len(claims) == 1
    assert claims[0].case_id == "case-flood-delhi-20261020"
    assert claims[0].claim_start < claims[0].claim_end


def test_load_evidence_nonexistent_file():
    with pytest.raises(EvidenceLoadError, match="Evidence file not found"):
        load_evidence_from_file("data/nonexistent_evidence_file.json")


def test_load_claims_nonexistent_file():
    with pytest.raises(ClaimLoadError, match="Claims file not found"):
        load_claims_from_file("data/nonexistent_claims_file.json")


def test_load_evidence_malformed_json():
    bad_json = "{ this is not valid json : 123 }"
    with pytest.raises(EvidenceLoadError, match="Invalid JSON syntax"):
        load_evidence_from_json(bad_json)


def test_load_evidence_empty_input():
    with pytest.raises(EvidenceLoadError, match="empty"):
        load_evidence_from_json("   ")


def test_load_evidence_validation_failure_reporting():
    # Missing required 'source_id' and 'source_type'
    invalid_item = """
    [
        {
            "evidence_id": "broken-ev-01"
        }
    ]
    """
    with pytest.raises(EvidenceLoadError) as exc_info:
        load_evidence_from_json(invalid_item)
    error_msg = str(exc_info.value)
    assert "broken-ev-01" in error_msg
    assert "source_type" in error_msg
    assert "source_id" in error_msg
