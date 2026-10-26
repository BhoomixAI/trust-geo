"""Tests for the frontend-facing API contract."""

import json

import pytest

from backend import api


def test_list_cases_shape():
    cases = api.list_cases()
    assert len(cases) == 12
    for c in cases:
        assert set(c) == {"case_id", "claim_text", "scenario", "scenario_tags"}
    json.dumps(cases)


def test_get_case_shape_and_json_safe():
    case = api.get_case("C01")
    assert case["expected_verdict"] == "SUPPORTED"
    assert [e["evidence_id"] for e in case["evidence"]] == ["ev-c01-sat", "ev-c01-gauge"]
    assert case["claim"]["claim_start"].startswith("2026-10-20")
    json.dumps(case)


def test_get_case_with_no_evidence():
    assert api.get_case("C06")["evidence"] == []


def test_get_case_unknown_id():
    with pytest.raises(api.CaseNotFoundError):
        api.get_case("C99")


@pytest.mark.parametrize("mode", ["baseline", "protected"])
def test_run_case_saves_and_exports(mode):
    result = api.run_case("C02", mode)
    assert result["mode"] == mode
    json.dumps(result)
    record = json.loads(api.export_run(result["run_id"]))
    assert record["result"]["run_id"] == result["run_id"]
    assert record["result"]["verdict"] == result["verdict"]
    assert api.list_runs("C02")[0]["run_id"] == result["run_id"]


def test_run_case_c02_baseline_vs_protected():
    assert api.run_case("C02", "baseline")["verdict"] == "REFUTED"
    assert api.run_case("C02", "protected")["verdict"] == "INSUFFICIENT_EVIDENCE"


def test_run_case_bad_mode():
    with pytest.raises(ValueError):
        api.run_case("C01", "turbo")


def test_reset_demo():
    api.run_case("C01", "protected")
    api.reset_demo()
    assert api.list_runs() == []
