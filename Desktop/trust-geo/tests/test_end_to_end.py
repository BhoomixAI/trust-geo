"""End-to-end: drive the whole backend only through the frontend API, as the UI will."""

import json

from backend import api, demo


def test_frontend_flow_through_api_only():
    cases = api.list_cases()
    assert len(cases) == 12

    for summary in cases:
        case = api.get_case(summary["case_id"])
        for mode in api.MODES:
            result = api.run_case(case["case_id"], mode)
            record = json.loads(api.export_run(result["run_id"]))
            assert record["result"] == result
            assert record["claim"] == case["claim"]
            assert record["evidence"] == case["evidence"]

    assert len(api.list_runs(limit=1000)) == 24

    report = api.run_benchmark()
    assert report["metrics"]["protected"]["verdict_accuracy"]["denominator"] == 12
    assert api.run_ablation()["checks"]

    api.reset_demo()
    assert api.list_runs() == []


def test_demo_script_runs_offline(capsys):
    assert demo.main(["--offline"]) == 0
    out = capsys.readouterr().out
    assert "Synthetic benchmark" in out
    assert "source: cached" in out
