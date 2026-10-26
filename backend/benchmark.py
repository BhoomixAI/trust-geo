"""Benchmark runner, metrics and ablation. Pure computation: callers load fixtures and store reports.

Metric definitions (Section 10.3). Every metric reports numerator, denominator and value;
value is None when the denominator is 0.
- verdict_accuracy:        predicted == expected / all cases
- failure_recall:          flawed cases where the system abstained / all flawed cases
                           (flawed = expected INSUFFICIENT_EVIDENCE or NEEDS_REVIEW)
- false_alarm_rate:        valid cases where the system abstained / all valid cases
                           (valid = expected SUPPORTED or REFUTED)
- appropriate_abstention:  predicted INSUFFICIENT_EVIDENCE / cases expected INSUFFICIENT_EVIDENCE
- unsafe_refutations:      predicted REFUTED / cases not expected REFUTED
- unsupported_confirmations: predicted SUPPORTED / cases not expected SUPPORTED
- traceability:            outputs whose cited evidence IDs all exist in the case bundle / outputs citing evidence
- latency_ms:              median, min, max over runs
All results are on synthetic cases and do not establish real-world reliability.
"""

from __future__ import annotations

import statistics
import uuid
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence

from backend.baseline import run_baseline
from backend.schemas import BenchmarkCase, Evidence, RunResult, Verdict
from backend.verifier import CHECK_NAMES, run_protected

ABSTAIN = frozenset({Verdict.INSUFFICIENT_EVIDENCE, Verdict.NEEDS_REVIEW})

NOTICE = (
    "Synthetic benchmark of 12 hand-built cases. Results show behaviour on these cases only "
    "and do not establish real-world reliability."
)


def ratio(numerator: int, denominator: int) -> Dict[str, Any]:
    """A metric with its counts. value is None when the denominator is 0."""
    return {
        "numerator": numerator,
        "denominator": denominator,
        "value": round(numerator / denominator, 4) if denominator else None,
    }


def _cited_ids(result: RunResult) -> set:
    ids = set(result.evidence_ids)
    for f in result.findings:
        ids.update(f.evidence_ids)
    return ids


def compute_metrics(cases: Sequence[BenchmarkCase], results: Sequence[RunResult]) -> Dict[str, Any]:
    """Metrics for one workflow mode. cases and results must be aligned by position."""
    pairs = list(zip(cases, results))
    for case, result in pairs:
        if case.case_id != result.case_id:
            raise ValueError(f"Misaligned case/result: {case.case_id} vs {result.case_id}")

    def count(pred: Callable[[BenchmarkCase, RunResult], bool], among: Callable[[BenchmarkCase], bool]):
        subset = [(c, r) for c, r in pairs if among(c)]
        return ratio(sum(1 for c, r in subset if pred(c, r)), len(subset))

    citing = [(c, r) for c, r in pairs if _cited_ids(r)]
    traceable = sum(1 for c, r in citing if _cited_ids(r) <= set(c.evidence_ids))
    latencies = [r.elapsed_ms for r in results]

    return {
        "verdict_accuracy": count(lambda c, r: r.verdict == c.expected_verdict, lambda c: True),
        "failure_recall": count(lambda c, r: r.verdict in ABSTAIN, lambda c: c.expected_verdict in ABSTAIN),
        "false_alarm_rate": count(lambda c, r: r.verdict in ABSTAIN, lambda c: c.expected_verdict not in ABSTAIN),
        "appropriate_abstention": count(
            lambda c, r: r.verdict == Verdict.INSUFFICIENT_EVIDENCE,
            lambda c: c.expected_verdict == Verdict.INSUFFICIENT_EVIDENCE,
        ),
        "unsafe_refutations": count(
            lambda c, r: r.verdict == Verdict.REFUTED, lambda c: c.expected_verdict != Verdict.REFUTED
        ),
        "unsupported_confirmations": count(
            lambda c, r: r.verdict == Verdict.SUPPORTED, lambda c: c.expected_verdict != Verdict.SUPPORTED
        ),
        "traceability": ratio(traceable, len(citing)),
        "latency_ms": {
            "n": len(latencies),
            "median": round(statistics.median(latencies), 3) if latencies else None,
            "min": round(min(latencies), 3) if latencies else None,
            "max": round(max(latencies), 3) if latencies else None,
        },
        "tokens_and_cost": "not applicable (no LLM calls)",
    }


def run_benchmark(
    cases: Sequence[BenchmarkCase],
    bundles: Dict[str, List[Evidence]],
) -> Dict[str, Any]:
    """Run every case through both workflows on identical inputs and compute metrics."""
    baseline = [run_baseline(c.claim, bundles[c.case_id]) for c in cases]
    protected = [run_protected(c.claim, bundles[c.case_id]) for c in cases]
    return {
        "benchmark_id": str(uuid.uuid4()),
        "synthetic": True,
        "notice": NOTICE,
        "n_cases": len(cases),
        "cases": [
            {
                "case_id": c.case_id,
                "scenario": c.scenario,
                "scenario_tags": list(c.scenario_tags),
                "expected_verdict": c.expected_verdict.value,
                "baseline": b.model_dump(mode="json"),
                "protected": p.model_dump(mode="json"),
                "baseline_correct": b.verdict == c.expected_verdict,
                "protected_correct": p.verdict == c.expected_verdict,
            }
            for c, b, p in zip(cases, baseline, protected)
        ],
        "metrics": {
            "baseline": compute_metrics(cases, baseline),
            "protected": compute_metrics(cases, protected),
        },
    }


def run_ablation(
    cases: Sequence[BenchmarkCase],
    bundles: Dict[str, List[Evidence]],
    checks: Optional[Iterable[str]] = None,
) -> Dict[str, Any]:
    """Re-run the protected workflow with one check disabled at a time and report what changes."""
    full = [run_protected(c.claim, bundles[c.case_id]) for c in cases]
    rows = []
    for name in (checks or CHECK_NAMES):
        ablated = [run_protected(c.claim, bundles[c.case_id], disabled_checks=[name]) for c in cases]
        changes = [
            {
                "case_id": c.case_id,
                "expected": c.expected_verdict.value,
                "with_check": f.verdict.value,
                "without_check": a.verdict.value,
            }
            for c, f, a in zip(cases, full, ablated)
            if f.verdict != a.verdict
        ]
        rows.append({
            "check_name": name,
            "verdict_changes": changes,
            "cases_broken": sum(
                1 for c, f, a in zip(cases, full, ablated)
                if f.verdict == c.expected_verdict and a.verdict != c.expected_verdict
            ),
            "metrics": compute_metrics(cases, ablated),
        })
    return {
        "synthetic": True,
        "notice": NOTICE,
        "full_protected_metrics": compute_metrics(cases, full),
        "checks": rows,
    }
