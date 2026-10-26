"""Baseline workflow: a simple, honest reference with no verification checks.

It takes each evidence item's stated stance at face value and takes a majority
vote. This is the natural "just read the evidence" approach, not a deliberately
crippled one. It receives exactly the same claim and evidence as the protected
workflow. No I/O.
"""

from __future__ import annotations

import time
import uuid
from typing import List, Optional

from backend.checks import extract_evidence_polarity
from backend.schemas import Claim, Evidence, RunResult, Verdict


def decide_baseline(evidence: List[Evidence]) -> tuple[Verdict, str]:
    """Majority vote over stated evidence stance. Returns (verdict, explanation)."""
    if not evidence:
        return Verdict.INSUFFICIENT_EVIDENCE, "No evidence was provided."

    supports = [e.evidence_id for e in evidence if extract_evidence_polarity(e) == "supports"]
    contradicts = [e.evidence_id for e in evidence if extract_evidence_polarity(e) == "contradicts"]

    if len(supports) > len(contradicts):
        return Verdict.SUPPORTED, f"Majority of evidence supports the claim ({', '.join(supports)})."
    if len(contradicts) > len(supports):
        return Verdict.REFUTED, f"Majority of evidence contradicts the claim ({', '.join(contradicts)})."
    if supports:
        return Verdict.NEEDS_REVIEW, "Evidence is evenly split between supporting and contradicting."
    return Verdict.INSUFFICIENT_EVIDENCE, "No evidence states a stance on the claim."


def run_baseline(claim: Claim, evidence: List[Evidence], run_id: Optional[str] = None) -> RunResult:
    """Run the baseline workflow on one claim and its evidence bundle."""
    start = time.perf_counter()
    verdict, explanation = decide_baseline(evidence)
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return RunResult(
        run_id=run_id or str(uuid.uuid4()),
        case_id=claim.case_id,
        mode="baseline",
        verdict=verdict,
        findings=[],
        evidence_ids=[e.evidence_id for e in evidence],
        next_evidence_needed=[],
        elapsed_ms=round(elapsed_ms, 3),
        synthetic_demo=all(e.is_synthetic for e in evidence),
        explanation=explanation,
        uncertainties=[],
    )
