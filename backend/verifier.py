"""Protected workflow: deterministic checks, then a Python verdict policy.

No I/O here. The verdict is decided only by `decide_verdict`, from findings and
structured evidence stance. Safety invariant: REFUTED requires counterevidence
that passed every enabled check (in time window, in AOI, complete metadata, no
injection). Stale, missing or off-location evidence can never produce REFUTED.
"""

from __future__ import annotations

import time
import uuid
from typing import Callable, Dict, FrozenSet, Iterable, List, Optional, Tuple

from backend.checks import (
    check_evidence_contradictions,
    extract_evidence_polarity,
    format_duration,
    format_window,
    run_injection_checks,
    run_metadata_checks,
    run_spatial_checks,
    run_temporal_checks,
)
from backend.schemas import Claim, Evidence, Finding, FindingStatus, RunResult, Verdict

# Check names as they appear in Finding.check_name. Used for ablation.
CHECK_NAMES: Tuple[str, ...] = (
    "temporal_relevance",
    "spatial_relevance",
    "metadata_completeness",
    "contradiction_detection",
    "prompt_injection_safety",
)

_CHECK_RUNNERS: Dict[str, Callable[[Claim, List[Evidence]], List[Finding]]] = {
    "temporal_relevance": lambda c, ev: run_temporal_checks(c, ev),
    "spatial_relevance": lambda c, ev: run_spatial_checks(c, ev),
    "metadata_completeness": lambda c, ev: run_metadata_checks(ev),
    "contradiction_detection": lambda c, ev: check_evidence_contradictions(c, ev) if ev else [],
    "prompt_injection_safety": lambda c, ev: run_injection_checks(ev),
}

# Finding codes that make an evidence item usable as direct support/counterevidence.
_QUALIFYING_CODES: Dict[str, FrozenSet[str]] = {
    "temporal_relevance": frozenset({"TEMPORAL_MATCH", "NEAR_INTERVAL"}),
    "spatial_relevance": frozenset({"SPATIAL_OVERLAP"}),
    "metadata_completeness": frozenset({"METADATA_OK"}),
    "prompt_injection_safety": frozenset({"NO_INJECTION_DETECTED"}),
}

# Codes that mean "a human must interpret this", not "decidably insufficient".
_AMBIGUITY_CODES: FrozenSet[str] = frozenset({"BOUNDARY_ONLY", "PUBLICATION_DATE_ONLY", "POSSIBLE_CONTRADICTION"})


def run_checks(
    claim: Claim,
    evidence: List[Evidence],
    disabled_checks: Iterable[str] = (),
) -> List[Finding]:
    """Run every enabled deterministic check and return all findings."""
    disabled = set(disabled_checks)
    unknown = disabled - set(CHECK_NAMES)
    if unknown:
        raise ValueError(f"Unknown check name(s): {', '.join(sorted(unknown))}")
    findings: List[Finding] = []
    for name in CHECK_NAMES:
        if name not in disabled:
            findings.extend(_CHECK_RUNNERS[name](claim, evidence))
    return findings


def _findings_by_evidence(findings: List[Finding]) -> Dict[str, Dict[str, Finding]]:
    """Map evidence_id -> check_name -> finding, for single-evidence checks."""
    out: Dict[str, Dict[str, Finding]] = {}
    for f in findings:
        if f.check_name in _QUALIFYING_CODES and len(f.evidence_ids) == 1:
            out.setdefault(f.evidence_ids[0], {})[f.check_name] = f
    return out


def _is_qualified(per_check: Dict[str, Finding], disabled: FrozenSet[str]) -> bool:
    """Evidence qualifies when every enabled per-evidence check returned a qualifying code."""
    for check_name, ok_codes in _QUALIFYING_CODES.items():
        if check_name in disabled:
            continue
        f = per_check.get(check_name)
        if f is None or f.code not in ok_codes:
            return False
    return True


def decide_verdict(
    claim: Claim,
    evidence: List[Evidence],
    findings: List[Finding],
    disabled_checks: Iterable[str] = (),
) -> Tuple[Verdict, str]:
    """Apply the verdict policy. Returns (verdict, explanation)."""
    disabled = frozenset(disabled_checks)

    if not evidence:
        return Verdict.INSUFFICIENT_EVIDENCE, "No evidence was provided. Absence of evidence is not evidence of absence."

    codes = {f.code for f in findings}

    injected = sorted({eid for f in findings if f.code == "INJECTION_SUSPECTED" for eid in f.evidence_ids})
    if injected:
        return Verdict.NEEDS_REVIEW, (
            f"Instruction-like text was found in evidence {', '.join(injected)}. It was treated as data, "
            "not instructions, but the source needs human review before it can be relied on."
        )

    if "CONTRADICTION" in codes:
        pairs = [f.evidence_ids for f in findings if f.code == "CONTRADICTION"]
        return Verdict.INSUFFICIENT_EVIDENCE, (
            f"Evidence conflicts for the same place and time ({'; '.join(' vs '.join(p) for p in pairs)}). "
            "Both sides are preserved; neither is chosen automatically."
        )

    per_ev = _findings_by_evidence(findings)
    supports: List[str] = []
    contradicts: List[str] = []
    for ev in evidence:
        if not _is_qualified(per_ev.get(ev.evidence_id, {}), disabled):
            continue
        stance = extract_evidence_polarity(ev)
        if stance == "supports":
            supports.append(ev.evidence_id)
        elif stance == "contradicts":
            contradicts.append(ev.evidence_id)

    if supports and contradicts:
        return Verdict.INSUFFICIENT_EVIDENCE, (
            f"Qualified evidence points both ways (supports: {', '.join(supports)}; "
            f"contradicts: {', '.join(contradicts)}). The conflict is unresolved."
        )
    if supports:
        return Verdict.SUPPORTED, (
            f"Evidence {', '.join(supports)} is in the claim window, covers the claimed area, has complete "
            "metadata, and directly supports the claim. No qualified counterevidence."
        )
    if contradicts:
        return Verdict.REFUTED, (
            f"Evidence {', '.join(contradicts)} is in the claim window, covers the claimed area, has complete "
            "metadata, and directly contradicts the claim. No qualified supporting evidence."
        )

    ambiguous = sorted(codes & _AMBIGUITY_CODES)
    if ambiguous:
        return Verdict.NEEDS_REVIEW, (
            f"No evidence qualifies as direct support or counterevidence, and the remaining questions "
            f"need human interpretation ({', '.join(ambiguous)})."
        )

    return Verdict.INSUFFICIENT_EVIDENCE, (
        "No evidence is both relevant (right time and place) and complete enough to support or refute "
        "the claim. This means 'cannot verify', not 'false'."
    )


def next_evidence_needed(claim: Claim, evidence: List[Evidence], findings: List[Finding], verdict: Verdict) -> List[str]:
    """Concrete evidence that would resolve the remaining uncertainty. Empty when the verdict is decisive."""
    if verdict in (Verdict.SUPPORTED, Verdict.REFUTED):
        return []

    window = format_window(claim.claim_start, claim.claim_end)
    needs: List[str] = []
    if not evidence:
        needs.append(f"Any observation of the claimed area on {window}, such as a satellite pass or a river gauge reading.")

    for f in findings:
        ids = ", ".join(f.evidence_ids)
        if f.code == "STALE_EVIDENCE":
            threshold = format_duration(f.details.get("freshness_threshold_hours"))
            gap = format_duration(f.details.get("temporal_gap_hours"))
            needs.append(f"An observation taken within {threshold} of {window}. "
                         f"The current one ({ids}) is {gap} away.")
        elif f.code == "TEMPORAL_UNKNOWN":
            needs.append(f"The date {ids} was actually observed. Ingestion or publication time is not the observation time.")
        elif f.code == "PUBLICATION_DATE_ONLY":
            needs.append(f"The actual event date described in {ids}; its publication date is not the event date.")
        elif f.code == "WRONG_LOCATION":
            needs.append(f"Evidence whose footprint covers the claimed area; {ids} is elsewhere.")
        elif f.code == "SPATIAL_UNKNOWN":
            needs.append(f"A location footprint (geometry or bbox) for {ids}.")
        elif f.code in ("INVALID_GEOMETRY", "INVALID_AOI"):
            needs.append(f"A valid geometry for {ids or 'the claim area'}.")
        elif f.code == "BOUNDARY_ONLY":
            needs.append(f"Evidence covering the interior of the claimed area; {ids} only touches its edge.")
        elif f.code in ("CONTRADICTION", "POSSIBLE_CONTRADICTION"):
            needs.append(f"An independent, dated observation of the same place and time to resolve {' vs '.join(f.evidence_ids)}.")
        elif f.code == "MISSING_METADATA":
            missing = f.details.get("missing_fields", []) + f.details.get("empty_fields", [])
            parts = [", ".join(missing)] if missing else []
            if f.details.get("missing_provenance"):
                parts.append("provenance")
            needs.append(f"Missing metadata for {ids}: {'; '.join(parts)}.")
        elif f.code == "UNKNOWN_SOURCE_TYPE":
            needs.append(f"A known source type and its required metadata for {ids}.")
        elif f.code == "INJECTION_SUSPECTED":
            needs.append(f"Human review of the source of {ids}, or the same information from an untampered source.")

    if not needs:
        needs.append(f"Direct, dated, in-area evidence about the event during {window}.")
    return list(dict.fromkeys(needs))


def _uncertainties(findings: List[Finding]) -> List[str]:
    return [f.explanation for f in findings if f.status != FindingStatus.PASS]


def run_protected(
    claim: Claim,
    evidence: List[Evidence],
    disabled_checks: Iterable[str] = (),
    run_id: Optional[str] = None,
) -> RunResult:
    """Run the protected workflow on one claim and its evidence bundle."""
    start = time.perf_counter()
    disabled = tuple(disabled_checks)
    findings = run_checks(claim, evidence, disabled)
    verdict, explanation = decide_verdict(claim, evidence, findings, disabled)
    needs = next_evidence_needed(claim, evidence, findings, verdict)
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return RunResult(
        run_id=run_id or str(uuid.uuid4()),
        case_id=claim.case_id,
        mode="protected",
        verdict=verdict,
        findings=findings,
        evidence_ids=[e.evidence_id for e in evidence],
        next_evidence_needed=needs,
        elapsed_ms=round(elapsed_ms, 3),
        synthetic_demo=all(e.is_synthetic for e in evidence),
        explanation=explanation,
        uncertainties=_uncertainties(findings),
    )
