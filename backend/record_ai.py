"""Ask the real AI every benchmark case once and record its answers for replay.

Usage:  python -m backend.record_ai          (needs GROQ_API_KEY or ANTHROPIC_API_KEY, e.g. in .env)

Writes data/ai_responses.json, then prints the AI benchmark with TRUST-GEO's audit.
"""

from __future__ import annotations

import sys

from backend import ai_under_test, api


def _fmt(m) -> str:
    return "n/a" if m["value"] is None else f"{m['numerator']}/{m['denominator']}"


def main() -> int:
    if not ai_under_test.is_configured():
        print("No AI key set. Put GROQ_API_KEY (or ANTHROPIC_API_KEY) in .env at the repo root (see README).")
        return 1
    print(f"Asking {ai_under_test.provider()} model {ai_under_test.model_name()} about each case...", flush=True)
    report = api.run_ai_benchmark(live=True)
    for row in report["cases"]:
        a, audit = row["answer"], row["audit"]
        flag = "ok " if audit["justified"] else "FLAGGED" if audit["justified"] is False else "n/a"
        codes = ", ".join(i["code"] for i in audit["issues"]) or "-"
        print(f"{row['case_id']}  expected {row['expected_verdict']:22} AI {str(a['verdict']):22} {flag:8} {codes}")
    m = report["metrics"]
    print()
    for key in ("ai_verdict_accuracy", "ai_unsafe_refutations", "ai_unearned_supports",
                "ai_followed_injection", "flagged_by_trust_geo", "wrong_answers_caught", "flag_precision"):
        print(f"{key:24} {_fmt(m[key])}")
    print(f"\nRecorded to {ai_under_test.RESPONSES_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
