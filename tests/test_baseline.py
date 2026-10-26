"""Tests for the baseline workflow. These record its actual behaviour, not a target."""

from datetime import datetime, timezone

from backend.baseline import decide_baseline, run_baseline
from backend.schemas import Claim, Evidence, Verdict

CLAIM = Claim(
    case_id="T1", claim_text="Flooding?", event_type="flooding",
    area_of_interest={"type": "Point", "coordinates": [77.2, 28.6]},
    claim_start=datetime(2026, 10, 20, tzinfo=timezone.utc),
    claim_end=datetime(2026, 10, 20, 23, 59, tzinfo=timezone.utc),
)


def ev(eid, status=None):
    md = {"event_status": status} if status else {}
    return Evidence(evidence_id=eid, source_type="news_report", source_id=eid, metadata=md)


def test_majority_vote():
    assert decide_baseline([ev("a", "flooding_observed")])[0] == Verdict.SUPPORTED
    assert decide_baseline([ev("a", "no_flooding_observed")])[0] == Verdict.REFUTED
    assert decide_baseline([ev("a", "flooding_observed"), ev("b", "no_flooding_observed")])[0] == Verdict.NEEDS_REVIEW
    assert decide_baseline([ev("a")])[0] == Verdict.INSUFFICIENT_EVIDENCE
    assert decide_baseline([])[0] == Verdict.INSUFFICIENT_EVIDENCE


def test_run_baseline_result():
    r = run_baseline(CLAIM, [ev("a", "flooding_observed")])
    assert r.mode == "baseline"
    assert r.findings == []
    assert r.evidence_ids == ["a"]
    assert r.elapsed_ms >= 0
