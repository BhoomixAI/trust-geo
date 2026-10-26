"""The ONLY interface the frontend uses. Every function returns JSON-serialisable dicts/lists.

All benchmark data is synthetic. Signatures are a contract with the frontend:
do not change them without telling the team.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List

from backend import benchmark, evidence_loader, storage
from backend.baseline import run_baseline
from backend.evidence_loader import (
    DATA_DIR,
    DEFAULT_CASES_PATH,
    DEFAULT_EVIDENCE_PATH,
    index_evidence,
    load_cases_from_file,
    load_evidence_from_file,
    resolve_case_evidence,
)
from backend.schemas import BenchmarkCase, Evidence, RunResult
from backend.verifier import run_protected

# Audit database location; override with the TRUST_GEO_DB environment variable.
DB_PATH = Path(os.environ.get("TRUST_GEO_DB", DATA_DIR / "trust_geo.db"))

MODES = ("baseline", "protected")


class CaseNotFoundError(KeyError):
    """Raised when a case_id does not exist in the benchmark."""


def _load_cases() -> List[BenchmarkCase]:
    return load_cases_from_file(DEFAULT_CASES_PATH)


def _evidence_index() -> Dict[str, Evidence]:
    return index_evidence(load_evidence_from_file(DEFAULT_EVIDENCE_PATH))


def _find_case(case_id: str) -> BenchmarkCase:
    for case in _load_cases():
        if case.case_id == case_id:
            return case
    raise CaseNotFoundError(f"Unknown case_id: '{case_id}'")


def list_cases() -> List[Dict[str, Any]]:
    """List benchmark cases: [{case_id, claim_text, scenario, scenario_tags}]."""
    return [
        {
            "case_id": c.case_id,
            "claim_text": c.claim.claim_text,
            "scenario": c.scenario,
            "scenario_tags": list(c.scenario_tags),
        }
        for c in _load_cases()
    ]


def get_case(case_id: str) -> Dict[str, Any]:
    """Return {case_id, scenario, scenario_tags, claim, evidence[], expected_verdict, reason, is_synthetic}."""
    case = _find_case(case_id)
    evidence = resolve_case_evidence(case, _evidence_index())
    return {
        "case_id": case.case_id,
        "scenario": case.scenario,
        "scenario_tags": list(case.scenario_tags),
        "claim": case.claim.model_dump(mode="json"),
        "evidence": [e.model_dump(mode="json") for e in evidence],
        "expected_verdict": case.expected_verdict.value,
        "reason": case.reason,
        "is_synthetic": case.is_synthetic,
    }


def run_case(case_id: str, mode: str) -> Dict[str, Any]:
    """Run one case in mode "baseline" or "protected" and return a RunResult dict.

    Shape: {run_id, case_id, mode, verdict, findings[{check_name, code, status, severity,
    evidence_ids, explanation, details}], evidence_ids, next_evidence_needed, elapsed_ms,
    timestamp, synthetic_demo, explanation, uncertainties}
    The run is saved to the audit database; pass its run_id to export_run.
    """
    case = _find_case(case_id)
    evidence = resolve_case_evidence(case, _evidence_index())
    result = _execute(case, evidence, mode)
    with storage.connect(DB_PATH) as conn:
        storage.save_run(conn, result, case.claim, evidence)
    return result.model_dump(mode="json")


def _execute(case: BenchmarkCase, evidence: List[Evidence], mode: str, disabled_checks=()) -> RunResult:
    if mode == "baseline":
        return run_baseline(case.claim, evidence)
    if mode == "protected":
        return run_protected(case.claim, evidence, disabled_checks=disabled_checks)
    raise ValueError(f"mode must be one of {MODES}, got '{mode}'")


def list_runs(case_id: str | None = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Audit history, newest first: [{run_id, case_id, mode, verdict, elapsed_ms, timestamp}]."""
    with storage.connect(DB_PATH) as conn:
        return storage.list_runs(conn, case_id, limit)


def reset_demo() -> Dict[str, Any]:
    """Delete all stored runs and benchmarks. Fixtures are not touched."""
    with storage.connect(DB_PATH) as conn:
        storage.reset(conn)
    return {"reset": True}


def _all_bundles() -> tuple[List[BenchmarkCase], Dict[str, List[Evidence]]]:
    cases = _load_cases()
    index = _evidence_index()
    return cases, {c.case_id: resolve_case_evidence(c, index) for c in cases}


def run_benchmark() -> Dict[str, Any]:
    """Run all cases in both modes on identical inputs. Every run is saved for audit.

    Shape: {benchmark_id, synthetic, notice, n_cases,
    cases: [{case_id, scenario, scenario_tags, expected_verdict, baseline: RunResult,
             protected: RunResult, baseline_correct, protected_correct}],
    metrics: {baseline: {...}, protected: {...}}}
    Each ratio metric is {numerator, denominator, value} (value is null when denominator is 0);
    latency_ms is {n, median, min, max}.
    """
    cases, bundles = _all_bundles()
    report = benchmark.run_benchmark(cases, bundles)
    claims = {c.case_id: c.claim for c in cases}
    with storage.connect(DB_PATH) as conn:
        for row in report["cases"]:
            for mode in MODES:
                result = RunResult.model_validate(row[mode])
                storage.save_run(conn, result, claims[row["case_id"]], bundles[row["case_id"]])
        storage.save_benchmark(conn, report["benchmark_id"], report)
    return report


def run_ablation() -> Dict[str, Any]:
    """Re-run the protected workflow with one check disabled at a time.

    Shape: {synthetic, notice, full_protected_metrics,
    checks: [{check_name, cases_broken, verdict_changes: [{case_id, expected, with_check,
    without_check}], metrics: {...}}]}
    """
    cases, bundles = _all_bundles()
    return benchmark.run_ablation(cases, bundles)


def nearest_acquisitions(bbox: List[float], date: str) -> Dict[str, Any]:
    """Nearest satellite passes before/after a date over a bbox.

    date is "YYYY-MM-DD". "before" includes a pass on the date itself (gap_days 0).
    Shape: {before: {item_id, acquired_at, gap_days, cloud_cover_pct, platform, collection, url} | null,
    after: {...} | null, source: "live" | "cached" | "unavailable", items_found, bbox, date,
    collection, window_days, note, retrieved_at?, live_error?}
    """
    return evidence_loader.nearest_acquisitions(bbox, date)


def export_run(run_id: str) -> str:
    """Return the full audit record for a stored run as a JSON string.

    Record: {run_id, code_version, synthetic_demo, notice, result, claim, evidence, exported_at}
    """
    with storage.connect(DB_PATH) as conn:
        return storage.export_run_json(conn, run_id)
