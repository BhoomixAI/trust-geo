# TRUST-GEO — Project brief for Claude

## What we are building
TRUST-GEO is a crash-testing harness for geospatial AI. It does NOT answer
questions like "did flooding happen here?". It tests whether an answer is
JUSTIFIED by evidence for the right place and time.

Core insight: the most dangerous AI answer is a confident one without real
evidence. "Can't verify" (INSUFFICIENT_EVIDENCE) is different from "false"
(REFUTED), and systems often confuse the two.

How it works: the same claim + evidence bundle goes through two workflows:
- Baseline: simple reference, no checks.
- Protected: deterministic checks (time, location, metadata, contradiction,
  prompt injection) then a verdict policy in Python.
A benchmark of 12 labelled synthetic cases compares both, with metrics.

Full spec: docs/TRUST_GEO_Technical_Guide.pdf
(Sections 8, 10, 12 are the build spec.)

backend/AGENT.md is an older spec. Where it conflicts with this file, this
file wins (e.g. no LLM agent, no agent.py).

## My role: BACKEND ONLY
I build everything in backend/ and tests/. A teammate builds app.py
(Streamlit). Never edit app.py. The frontend only calls backend/api.py.

## Backend files (package: backend/)
- schemas.py       Pydantic models: Claim, Evidence, Finding, RunResult, Verdict
- checks.py        pure functions: temporal, spatial, metadata, contradiction, injection
- evidence_loader.py  load fixtures; later STAC search with cached fallback
- baseline.py      simple reference workflow
- verifier.py      protected workflow + verdict policy + next_evidence_needed
- storage.py       sqlite3, parameterised SQL only
- benchmark.py     run all cases, metrics with counts + denominators, ablation
- api.py           the ONLY interface the frontend uses (see contract below)

## backend/api.py contract (do not change signatures without telling me)
All functions return JSON-serialisable dicts/lists.
- list_cases() -> list of {case_id, claim_text, scenario_tags}
- get_case(case_id) -> {claim, evidence[], expected_verdict}
- run_case(case_id, mode) -> RunResult dict; mode is "baseline" or "protected"
- run_benchmark() -> per-case results + metrics for both modes
- run_ablation() -> per-check impact on verdicts and metrics
- nearest_acquisitions(bbox, date) -> nearest satellite pass before/after, gap days, live or cached
- export_run(run_id) -> full audit record as JSON string

## Verdicts
SUPPORTED, REFUTED, INSUFFICIENT_EVIDENCE, NEEDS_REVIEW (see Section 9).

## Non-negotiable rules
- Time limit: 10 hours. Always choose the simplest version that works.
- Stack: Python, Pydantic, Shapely, sqlite3, pystac-client, pytest only.
- No LLM calls, no agent frameworks, no raster processing.
- Stale, missing or off-location evidence must NEVER produce REFUTED.
- Publication date is not event date. Acquisition date is not ingestion date.
- Missing metadata means unknown, not false.
- NEVER edit expected verdicts in data/test_cases.json, even if tests fail.
- All fixture data is synthetic and labelled synthetic.
- Checks are pure functions with no I/O.
- Run `pytest -q` after every change. Never say "done" with failing tests.
- Work only on the step I ask for. Don't build ahead.
