"""Tests for JSON evidence and claim loading, parsing and validation diagnostics."""

from pathlib import Path
import pytest

from backend.evidence_loader import (
    EvidenceLoadError,
    ClaimLoadError,
    load_evidence_from_file,
    load_evidence_from_json,
    load_claims_from_file,
    CaseLoadError,
    DEFAULT_CASES_PATH,
    DEFAULT_EVIDENCE_PATH,
    index_evidence,
    load_cases_from_file,
    resolve_case_evidence,
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
    assert len(evidence_list) == 19
    for item in evidence_list:
        assert item.is_synthetic is True
        assert item.evidence_id.startswith("ev-")
    index_evidence(evidence_list)  # raises on duplicate IDs


# Frozen labels approved by the team. Never edit to make a failing test pass.
FROZEN_LABELS = {
    "C01": "SUPPORTED",
    "C02": "INSUFFICIENT_EVIDENCE",
    "C03": "INSUFFICIENT_EVIDENCE",
    "C04": "INSUFFICIENT_EVIDENCE",
    "C05": "INSUFFICIENT_EVIDENCE",
    "C06": "INSUFFICIENT_EVIDENCE",
    "C07": "NEEDS_REVIEW",
    "C08": "SUPPORTED",
    "C09": "NEEDS_REVIEW",
    "C10": "NEEDS_REVIEW",
    "C11": "REFUTED",
    "C12": "INSUFFICIENT_EVIDENCE",
}


def test_benchmark_cases_load_with_frozen_labels():
    cases = load_cases_from_file()
    assert [c.case_id for c in cases] == list(FROZEN_LABELS)
    assert {c.case_id: c.expected_verdict.value for c in cases} == FROZEN_LABELS
    for c in cases:
        assert c.is_synthetic is True
        assert c.claim.claim_start < c.claim.claim_end
        assert c.scenario_tags


def test_every_case_resolves_its_evidence():
    index = index_evidence(load_evidence_from_file(DEFAULT_EVIDENCE_PATH))
    for case in load_cases_from_file():
        bundle = resolve_case_evidence(case, index)
        assert [e.evidence_id for e in bundle] == case.evidence_ids
    assert resolve_case_evidence(next(c for c in load_cases_from_file() if c.case_id == "C06"), index) == []


def test_unknown_evidence_id_is_an_error(tmp_path):
    case = load_cases_from_file()[0].model_copy(update={"evidence_ids": ["ev-does-not-exist"]})
    with pytest.raises(CaseLoadError, match="unknown evidence ID"):
        resolve_case_evidence(case, {})


def test_load_cases_rejects_duplicates_and_missing_file(tmp_path):
    import json
    raw = json.loads(Path(DEFAULT_CASES_PATH).read_text(encoding="utf-8"))
    dup = tmp_path / "dup.json"
    dup.write_text(json.dumps([raw[0], raw[0]]), encoding="utf-8")
    with pytest.raises(CaseLoadError, match="Duplicate case_id"):
        load_cases_from_file(dup)
    with pytest.raises(CaseLoadError, match="not found"):
        load_cases_from_file(tmp_path / "nope.json")


def test_load_claims_from_flat_claims_file(tmp_path):
    claims_path = tmp_path / "claims.json"
    claims_path.write_text(
        '[{"case_id": "x", "claim_text": "Flood?", "event_type": "flooding",'
        ' "area_of_interest": {"type": "Point", "coordinates": [77.2, 28.6]},'
        ' "claim_start": "2026-10-20T00:00:00Z", "claim_end": "2026-10-20T23:59:59Z"}]',
        encoding="utf-8",
    )
    claims = load_claims_from_file(claims_path)
    assert len(claims) == 1
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
