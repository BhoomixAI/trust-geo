"""Tests for core TRUST-GEO Pydantic schemas."""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError

from backend.schemas import (
    Claim,
    Evidence,
    Finding,
    FindingSeverity,
    FindingStatus,
    BenchmarkCase,
    RunResult,
    Verdict,
    VerdictEnum,
)


def test_valid_claim():
    claim = Claim(
        case_id="case-001",
        claim_text="Flooding occurred in river basin",
        event_type="flooding",
        area_of_interest={"type": "Point", "coordinates": [77.2, 28.6]},
        claim_start=datetime(2026, 10, 20, 0, 0, tzinfo=timezone.utc),
        claim_end=datetime(2026, 10, 20, 23, 59, tzinfo=timezone.utc),
    )
    assert claim.case_id == "case-001"
    assert claim.claim_start <= claim.claim_end


def test_claim_invalid_interval():
    with pytest.raises(ValidationError, match="claim_start .* cannot be after claim_end"):
        Claim(
            case_id="case-002",
            claim_text="Invalid date claim",
            event_type="flooding",
            area_of_interest={"type": "Point", "coordinates": [77.2, 28.6]},
            claim_start=datetime(2026, 10, 21, 0, 0, tzinfo=timezone.utc),
            claim_end=datetime(2026, 10, 20, 0, 0, tzinfo=timezone.utc),
        )


def test_claim_rejects_naive_datetime():
    with pytest.raises(ValidationError, match="timezone-aware"):
        Claim(
            case_id="case-003",
            claim_text="Naive datetime claim",
            event_type="flooding",
            area_of_interest={"type": "Point", "coordinates": [77.2, 28.6]},
            claim_start=datetime(2026, 10, 20, 0, 0),  # Naive
            claim_end=datetime(2026, 10, 20, 23, 59, tzinfo=timezone.utc),
        )


def test_valid_evidence_distinct_dates():
    ev = Evidence(
        evidence_id="ev-001",
        source_type="satellite",
        source_id="SAT-1234",
        acquired_at=datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc),
        published_at=datetime(2026, 10, 21, 14, 0, tzinfo=timezone.utc),
        content="Optical imagery of flood extent",
        is_synthetic=True,
    )
    assert ev.acquired_at != ev.published_at
    assert ev.is_synthetic is True


def test_evidence_rejects_naive_timestamp():
    with pytest.raises(ValidationError, match="timezone-aware"):
        Evidence(
            evidence_id="ev-002",
            source_type="sensor",
            source_id="GAUGE-1",
            acquired_at=datetime(2026, 10, 20, 12, 0),  # Naive
        )


def test_valid_finding():
    finding = Finding(
        check_name="temporal_relevance",
        status=FindingStatus.PASS,
        severity=FindingSeverity.INFO,
        evidence_ids=["ev-001"],
        explanation="Evidence is within interval",
        details={"gap": 0},
    )
    assert finding.status == FindingStatus.PASS
    assert finding.severity == FindingSeverity.INFO


def test_run_result_allowed_verdicts():
    for verdict in VerdictEnum:
        res = RunResult(
            run_id="run-001",
            case_id="case-001",
            mode="protected",
            verdict=verdict,
            timestamp=datetime.now(timezone.utc),
            synthetic_demo=True,
        )
        assert res.verdict == verdict


def test_run_result_invalid_verdict():
    with pytest.raises(ValidationError):
        RunResult(
            run_id="run-002",
            case_id="case-001",
            mode="protected",
            verdict="DEFINITELY_TRUE",  # Not allowed
            timestamp=datetime.now(timezone.utc),
        )


def test_verdict_alias_is_same_enum():
    assert VerdictEnum is Verdict
    assert {v.value for v in Verdict} == {
        "SUPPORTED", "REFUTED", "INSUFFICIENT_EVIDENCE", "NEEDS_REVIEW"
    }


def test_run_result_rejects_unknown_mode():
    with pytest.raises(ValidationError):
        RunResult(run_id="r", case_id="c", mode="turbo", verdict=Verdict.SUPPORTED)


def test_run_result_new_fields_and_json_roundtrip():
    res = RunResult(
        run_id="run-003",
        case_id="C01",
        mode="baseline",
        verdict=Verdict.INSUFFICIENT_EVIDENCE,
        next_evidence_needed=["Satellite pass within 72h of claim window"],
        elapsed_ms=12.5,
    )
    data = res.model_dump(mode="json")
    assert data["mode"] == "baseline"
    assert data["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert data["next_evidence_needed"] == ["Satellite pass within 72h of claim window"]
    assert data["elapsed_ms"] == 12.5
    assert RunResult.model_validate(data) == res


def test_run_result_rejects_negative_elapsed():
    with pytest.raises(ValidationError):
        RunResult(run_id="r", case_id="c", mode="protected",
                  verdict=Verdict.SUPPORTED, elapsed_ms=-1)


def test_finding_code_defaults_and_can_be_set():
    f = Finding(check_name="temporal_relevance", status=FindingStatus.PASS,
                severity=FindingSeverity.INFO, explanation="ok")
    assert f.code == "UNSPECIFIED"
    f2 = Finding(check_name="temporal_relevance", code="TEMPORAL_MATCH",
                 status=FindingStatus.PASS, severity=FindingSeverity.INFO, explanation="ok")
    assert f2.code == "TEMPORAL_MATCH"


def _claim(case_id="C01"):
    return {
        "case_id": case_id,
        "claim_text": "Did flooding occur in Area A on 20 October?",
        "event_type": "flooding",
        "area_of_interest": {"type": "Point", "coordinates": [77.2, 28.6]},
        "claim_start": "2026-10-20T00:00:00Z",
        "claim_end": "2026-10-20T23:59:59Z",
    }


def test_benchmark_case_valid():
    case = BenchmarkCase(
        case_id="C01", scenario="Correct date/AOI with support",
        scenario_tags=["valid_support"], claim=_claim("C01"),
        evidence_ids=["E1"], expected_verdict="SUPPORTED",
        reason="Valid evidence should pass.",
    )
    assert case.expected_verdict == Verdict.SUPPORTED
    assert case.is_synthetic is True


def test_benchmark_case_rejects_mismatched_case_id():
    with pytest.raises(ValidationError, match="does not match"):
        BenchmarkCase(
            case_id="C01", scenario="x", claim=_claim("C02"),
            expected_verdict="SUPPORTED", reason="x",
        )


def test_benchmark_case_rejects_unknown_verdict():
    with pytest.raises(ValidationError):
        BenchmarkCase(
            case_id="C01", scenario="x", claim=_claim("C01"),
            expected_verdict="PROBABLY", reason="x",
        )
