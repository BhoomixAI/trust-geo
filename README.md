# TRUST-GEO

**Geospatial AI Reliability and Crash-Testing Harness**

TRUST-GEO does not answer "did flooding happen here?". It tests whether an answer is
**justified by evidence for the right place and time**. The same claim and evidence bundle
goes through two workflows:

- **Baseline**: a simple reference that takes each evidence item's stated stance at face value (majority vote).
- **Protected**: deterministic checks (time, place, metadata, contradiction, prompt injection),
  then a rule-based Python verdict policy.

A benchmark of 12 labelled **synthetic** cases compares both. No LLM calls, no API keys.

**Live demo:** https://trust-geo.onrender.com (free plan: the first visit after 15 idle minutes takes up to a minute to wake).

## Verdicts

| Verdict | Means |
|---|---|
| `SUPPORTED` | In-window, in-area, complete evidence supports the claim |
| `REFUTED` | In-window, in-area, complete evidence directly contradicts it |
| `INSUFFICIENT_EVIDENCE` | Cannot verify: evidence absent, stale, off-location, incomplete or conflicting |
| `NEEDS_REVIEW` | A human must interpret: boundary-only geometry, publication-date-only reports, injection attempts |

Stale, missing or off-location evidence can never produce `REFUTED`. "Cannot verify" is not "false".

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
```

## Commands

```bash
python -m pytest -q                 # run all tests
python -m backend.demo              # full end-to-end demo: benchmark, ablation, live satellite lookup, export
python -m backend.demo --offline    # same, using the cached satellite lookup
```

The audit database defaults to `data/trust_geo.db` (git-ignored). Override with the `TRUST_GEO_DB` environment variable.

## Run the full app (backend + React frontend)

Two terminals:

```bash
# 1. Backend API on http://127.0.0.1:8000  (from the repo root)
python -m backend.server

# 2. Frontend on http://localhost:5173  (from FRONTEND/)
npm install
npm run dev
```

Vite proxies `/api` to the backend, so open http://localhost:5173. The server is standard-library
`http.server`, binds to 127.0.0.1 only, and allows browser calls from `TRUST_GEO_CORS_ORIGINS`
(default: the Vite dev origins).

| Route | Calls |
|---|---|
| `GET /api/health` | — |
| `GET /api/dashboard` | `dashboard_summary()` |
| `GET /api/cases` | `list_cases()` |
| `GET /api/evidence` | `list_evidence()` |
| `GET /api/cases/{id}` | `get_case(id)` |
| `POST /api/cases/{id}/run` body `{"mode": "baseline"\|"protected"}` | `run_case(id, mode)` |
| `POST /api/benchmark` | `run_benchmark()` |
| `GET /api/ablation` | `run_ablation()` |
| `GET /api/acquisitions?bbox=a,b,c,d&date=YYYY-MM-DD` | `nearest_acquisitions(bbox, date)` |
| `GET /api/runs?case_id=&limit=` | `list_runs(case_id, limit)` |
| `GET /api/runs/{run_id}/export` | `export_run(run_id)` |
| `POST /api/reset` | `reset_demo()` |

Errors return JSON `{"error": "..."}` with status 400, 404, 405 or 500.

## Deploy (Render)

The app deploys as one Docker web service: the `Dockerfile` builds the React app, then runs
the Python server, which serves both the app and `/api` on the port Render provides.

1. Sign in at https://render.com with the GitHub account that can access this repository.
2. **New → Blueprint**, pick this repository. Render reads `render.yaml` and creates the
   `trust-geo` web service on the free plan.
3. Wait for the build (a few minutes), then open the `https://trust-geo-….onrender.com` URL.
   `/api/health` should return `{"status": "ok", ...}`.

The live service (https://trust-geo.onrender.com) deploys from the fork `BhoomixAI/trust-geo`.
Push to both repos so the team repo and the live site stay in step:
`git push origin master && git push deploy master` (one-time setup:
`git remote add deploy https://github.com/BhoomixAI/trust-geo.git`). Each push to the fork's
`master` redeploys automatically. On the free plan the service sleeps after
15 minutes without traffic (the first request then takes up to about a minute), and the audit
history resets on each redeploy or restart because the filesystem is temporary.

To run the production setup locally: `cd FRONTEND && npm run build`, then from the repo root
`python -m backend.server` and open http://127.0.0.1:8000.

## Frontend interface

The frontend calls only `backend/api.py`. Every function returns JSON-serialisable data.

| Function | Returns |
|---|---|
| `list_cases()` | `[{case_id, claim_text, scenario, scenario_tags}]` |
| `get_case(case_id)` | `{case_id, scenario, scenario_tags, claim, evidence[], expected_verdict, reason, is_synthetic}` |
| `run_case(case_id, mode)` | RunResult dict (`mode` = `"baseline"` or `"protected"`); saved for audit |
| `run_benchmark()` | per-case results for both modes + metrics with numerators and denominators |
| `run_ablation()` | protected workflow with each check disabled in turn, and which cases break |
| `nearest_acquisitions(bbox, date)` | nearest real Sentinel-2 passes before/after `date`; `source` is `live`, `cached` or `unavailable` |
| `export_run(run_id)` | full audit record (result, claim, evidence snapshot, version) as a JSON string |
| `list_runs(case_id=None, limit=100)` | audit history, newest first |
| `dashboard_summary()` | dashboard stats, per-case results, metrics, failure modes, recent runs and findings, AOI |
| `list_evidence()` | every evidence item with the cases that use it |
| `reset_demo()` | delete all stored runs and benchmarks |

## Project structure

```text
backend/
  schemas.py          Pydantic models: Claim, Evidence, Finding, RunResult, BenchmarkCase, Verdict
  checks.py           pure check functions (no I/O); every Finding has a code
  evidence_loader.py  fixture and case loading; STAC search with cached fallback
  verifier.py         protected workflow, verdict policy, next_evidence_needed
  baseline.py         baseline workflow
  benchmark.py        metrics and ablation
  storage.py          SQLite audit store (parameterised SQL only)
  api.py              the only interface the frontend uses
  server.py           HTTP JSON server wrapping api.py (standard library only)
  demo.py             end-to-end demo script
data/
  test_cases.json         12 labelled synthetic cases (labels frozen)
  synthetic_evidence.json synthetic evidence fixtures
  stac_cache.json         cached real catalogue metadata for offline demos
docs/TRUST_GEO_Technical_Guide.pdf
tests/
FRONTEND/                 React (Vite) app; calls the backend through /api
```

## Conventions

- Geometries are WGS84 (EPSG:4326), GeoJSON `[lon, lat]` order. Invalid geometry is reported, never silently repaired.
- `acquired_at` (observation time) is never inferred from `published_at` or ingestion time.
- Missing metadata means unknown, not false.
- Evidence text is untrusted data. Injection detection is a heuristic, not a guarantee.

## Honest limits

- All 12 cases are synthetic, and the cases and verdict policy were written by the same team.
  The protected workflow's score shows the policy behaves as designed on these traps; it does not
  establish real-world reliability.
- Evidence stance comes from structured metadata labels (e.g. `event_status`), not from reading free text.
- A satellite catalogue item proves the area was imaged, not that an event occurred. No pixels are processed.
