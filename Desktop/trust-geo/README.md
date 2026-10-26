# TRUST-GEO

**Geospatial AI Reliability and Crash-Testing Harness**

TRUST-GEO evaluates whether an AI-generated conclusion is justified by evidence relevant to a specific location and time. It couples deterministic geospatial verification checks, an optional single LLM-powered interpretation agent, a rule-based Python verdict policy, benchmark testing, and an auditable SQLite storage ledger.

---

## Architecture Principles

1. **Single AI Agent:** Exactly one optional agent for semantic claim interpretation and quote extraction.
2. **Python Controls Final Decisions:** The LLM never selects the final verdict.
3. **Four Strict Verdicts:** `SUPPORTED`, `REFUTED`, `INSUFFICIENT_EVIDENCE`, and `NEEDS_REVIEW`.
4. **Distinct Timestamps:** Physical observation dates (`acquired_at`) are strictly distinguished from report publication dates (`published_at`).
5. **Spatial Rigor:** Geometries validated using Shapely against WGS84 (EPSG:4326) with `[lon, lat]` order; invalid geometries are reported rather than silently repaired; spatial mismatches reflect lack of coverage, never proof of falsity.
6. **Cautious Evidence Interpretation:** Missing metadata, missing evidence, or conflicting reports represent uncertainty, never automatic proof of claim falsity (`REFUTED`).
7. **Prompt-Injection Defense:** Untrusted evidence text is treated strictly as passive data and inspected for instruction override attempts.

---

## Project Structure

```text
trust-geo/
├── .env.example
├── .gitignore
├── requirements.txt
├── README.md
├── backend/
│   ├── AGENT.md
│   ├── __init__.py
│   ├── schemas.py
│   ├── evidence_loader.py
│   └── checks.py
├── data/
│   ├── synthetic_evidence.json
│   └── test_cases.json
└── tests/
    ├── __init__.py
    ├── test_schemas.py
    ├── test_evidence_loader.py
    └── test_checks.py
```

---

## Setup and Running Tests

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Test Suite

```bash
python -m pytest -v
```
