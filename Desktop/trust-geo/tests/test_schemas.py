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
    VerdictEnum,
    VerificationResult,
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


def test_verification_result_allowed_verdicts():
    for verdict in VerdictEnum:
        res = VerificationResult(
            run_id="run-001",
            case_id="case-001",
            workflow_mode="protected",
            verdict=verdict,
            timestamp=datetime.now(timezone.utc),
            synthetic_demo=True,
        )
        assert res.verdict == verdict


def test_verification_result_invalid_verdict():
    with pytest.raises(ValidationError):
        VerificationResult(
            run_id="run-002",
            case_id="case-001",
            workflow_mode="protected",
            verdict="DEFINITELY_TRUE",  # Not allowed
            timestamp=datetime.now(timezone.utc),
        )
