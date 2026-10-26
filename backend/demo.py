"""Run the full backend end to end from a clean audit database and print a summary.

Usage:  python -m backend.demo            (live satellite lookup, falls back to cache)
        python -m backend.demo --offline  (cache only)
"""

from __future__ import annotations

import sys

from shapely.geometry import shape

from backend import api, evidence_loader


def _fmt(metric: dict) -> str:
    v = metric["value"]
    pct = "n/a" if v is None else f"{v:.0%}"
    return f"{metric['numerator']}/{metric['denominator']} ({pct})"


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    api.reset_demo()

    report = api.run_benchmark()
    print(report["notice"], "\n")
    print(f"{'case':5} {'expected':22} {'baseline':22} {'protected':22}")
    for row in report["cases"]:
        b, p = row["baseline"]["verdict"], row["protected"]["verdict"]
        print(f"{row['case_id']:5} {row['expected_verdict']:22} "
              f"{b + (' ' if row['baseline_correct'] else ' X'):22} "
              f"{p + (' ' if row['protected_correct'] else ' X'):22}")

    print(f"\n{'metric':26} {'baseline':16} {'protected':16}")
    for name in ("verdict_accuracy", "failure_recall", "false_alarm_rate", "appropriate_abstention",
                 "unsafe_refutations", "unsupported_confirmations", "traceability"):
        print(f"{name:26} {_fmt(report['metrics']['baseline'][name]):16} "
              f"{_fmt(report['metrics']['protected'][name]):16}")

    print("\nAblation (protected, one check disabled):")
    for row in api.run_ablation()["checks"]:
        broken = [c["case_id"] for c in row["verdict_changes"] if c["with_check"] == c["expected"]]
        print(f"  without {row['check_name']:24} cases broken: {row['cases_broken']} {broken}")

    case = api.get_case("C02")
    bbox = list(shape(case["claim"]["area_of_interest"]).bounds)
    if "--offline" in argv:
        acq = evidence_loader.nearest_acquisitions(bbox, "2026-10-20", search_fn=_offline)
    else:
        acq = api.nearest_acquisitions(bbox, "2026-10-20")
    print(f"\nNearest real Sentinel-2 passes for the C02 area around 2026-10-20 (source: {acq['source']}):")
    for side in ("before", "after"):
        item = acq[side]
        print(f"  {side:6}: " + (f"{item['item_id']} at {item['acquired_at']} (gap {item['gap_days']} days)"
                                  if item else "none found"))

    run = next(r for r in report["cases"] if r["case_id"] == "C02")["protected"]
    print(f"\nAudit export for C02 protected run {run['run_id']}: {len(api.export_run(run['run_id']))} bytes of JSON")
    return 0


def _offline(bbox, dt, collection):
    raise ConnectionError("offline mode")


if __name__ == "__main__":
    raise SystemExit(main())
