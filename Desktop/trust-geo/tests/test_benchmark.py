"""Tests for benchmark metrics and ablation."""

import json

import pytest

from backend import api, storage
from backend.benchmark import compute_metrics, ratio
from backend.schemas import RunResult, Verdict


def test_ratio_handles_zero_denominator():
    assert ratio(0, 0) == {"numerator": 0, "denominator": 0, "value": None}
    assert ratio(1, 4)["value"] == 0.25


def test_metrics_on_empty_input():
    m = compute_metrics([], [])
    assert m["verdict_accuracy"]["value"] is None
    assert m["latency_ms"]["median"] is None


@pytest.fixture(scope="module")
def report():
    return api.run_benchmark()


def test_benchmark_shape(report):
    assert report["synthetic"] is True
    assert "do not establish real-world reliability" in report["notice"]
    assert report["n_cases"] == len(report["cases"]) == 12
    json.dumps(report)


def test_metric_counts_match_per_case_results(report):
    for mode in ("baseline", "protected"):
        correct = sum(1 for row in report["cases"] if row[f"{mode}_correct"])
        acc = report["metrics"][mode]["verdict_accuracy"]
        assert (acc["numerator"], acc["denominator"]) == (correct, 12)

        flawed = [r for r in report["cases"] if r["expected_verdict"] in ("INSUFFICIENT_EVIDENCE", "NEEDS_REVIEW")]
        recall = report["metrics"][mode]["failure_recall"]
        assert recall["denominator"] == len(flawed)
        assert recall["numerator"] == sum(
            1 for r in flawed if r[mode]["verdict"] in ("INSUFFICIENT_EVIDENCE", "NEEDS_REVIEW")
        )


def test_protected_never_refutes_unsafely(report):
    assert report["metrics"]["protected"]["unsafe_refutations"]["numerator"] == 0


def test_both_modes_got_identical_inputs(report):
    for row in report["cases"]:
        assert row["baseline"]["evidence_ids"] == row["protected"]["evidence_ids"]


def test_benchmark_runs_are_stored():
    api.run_benchmark()
    with storage.connect(api.DB_PATH) as conn:
        assert len(storage.list_runs(conn, limit=1000)) == 24
        assert conn.execute("SELECT COUNT(*) FROM benchmarks").fetchone()[0] == 1


def test_misaligned_results_rejected():
    from backend.evidence_loader import load_cases_from_file
    cases = load_cases_from_file()[:2]
    wrong = [RunResult(run_id="r", case_id="X", mode="baseline", verdict=Verdict.SUPPORTED)] * 2
    with pytest.raises(ValueError, match="Misaligned"):
        compute_metrics(cases, wrong)


def test_ablation_shape_and_effect():
    result = api.run_ablation()
    names = [row["check_name"] for row in result["checks"]]
    assert names == ["temporal_relevance", "spatial_relevance", "metadata_completeness",
                     "contradiction_detection", "prompt_injection_safety"]
    by_name = {row["check_name"]: row for row in result["checks"]}
    # Removing the time check must let the stale-image trap through.
    assert any(c["case_id"] == "C02" for c in by_name["temporal_relevance"]["verdict_changes"])
    for row in result["checks"]:
        assert row["cases_broken"] == sum(1 for c in row["verdict_changes"] if c["with_check"] == c["expected"])
    json.dumps(result)
