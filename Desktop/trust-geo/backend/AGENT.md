> **Outdated where it conflicts with CLAUDE.md.**

# AGENT.md — TRUST-GEO

## 1. Project Overview

TRUST-GEO is a Geospatial AI Reliability and Crash-Testing Harness.

Its purpose is to evaluate whether an AI-generated conclusion is justified by evidence relevant to a specific location and time.

Example claim:

"Did flooding occur in this area on 20 October?"

The system evaluates the claim against available evidence, checks for evidence-quality problems, produces a cautious verdict, and records an auditable verification result.

**This is an evidence-verification and reliability-testing system, not a system that automatically establishes ground truth.**

## 2. Primary Objective

Build a working, modular application with:

- One AI agent for semantic interpretation of claims and reports.
- A Python backend for evidence validation and deterministic verification.
- A rule-based verdict policy independent of the LLM.
- A baseline-versus-protected workflow comparison.
- A benchmark suite containing labelled test cases.
- SQLite audit storage and JSON export.
- A user interface for claims, evidence, findings, verdicts and benchmark results.
- Optional real satellite metadata integration after the core system works.

Prioritise correctness, traceability, reproducibility and safe handling of uncertainty over unnecessary complexity.

## 3. Mandatory Architecture Rules

### Single-agent architecture

Use exactly ONE LLM-powered agent.

The agent may interpret text, extract candidate facts, identify evidence passages and report uncertainty.

Do not create:
- Multiple collaborating AI agents.
- Agent-to-agent conversations.
- Separate autonomous reviewer or researcher agents.
- Unnecessary agent orchestration frameworks.

Ordinary Python modules and functions are encouraged. Multiple modules do not constitute multiple AI agents.

### Python controls final decisions

The LLM must never independently determine the final verdict.

The protected workflow must follow this pattern:

1. Validate the claim.
2. Load and normalise evidence.
3. Run the single AI agent when configured.
4. Validate the agent's structured output.
5. Run deterministic verification checks.
6. Apply the Python verdict policy.
7. Save findings and the final result.
8. Calculate benchmark metrics when requested.

The application must also work in a clearly labelled demo mode without an LLM API key.

## 4. Technology Stack

Use the following technologies unless the existing project has a justified, documented alternative.

- Python: backend logic.
- Streamlit: user interface.
- Pydantic v2: typed models and validation.
- Shapely: geographical geometry validation and intersection.
- pytest: automated tests.
- SQLite: persistent audit records.
- JSON: synthetic evidence, test cases and exports.
- python-dotenv: local environment configuration.
- pystac-client: optional STAC catalogue integration.
- One configurable LLM provider: optional semantic interpretation.

Start with one Python process. Do not introduce distributed services, vector databases, raster processing or complex orchestration unless a demonstrated requirement justifies them.

## 5. Project Structure

Adapt to the existing repository rather than blindly recreating files.

Recommended structure:

```text
trust-geo/
├── AGENT.md
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
├── app.py
├── backend/
│   ├── __init__.py
│   ├── schemas.py
│   ├── evidence_loader.py
│   ├── checks.py
│   ├── agent.py
│   ├── verdict.py
│   ├── baseline.py
│   ├── verifier.py
│   ├── benchmark.py
│   ├── storage.py
│   ├── reporting.py
│   └── settings.py
├── data/
│   ├── test_cases.json
│   └── evidence_fixtures.json
└── tests/
    ├── test_schemas.py
    ├── test_checks.py
    ├── test_agent.py
    ├── test_verdict.py
    ├── test_benchmark.py
    └── test_storage.py
```

If the existing `backend` directory is already the Python package, keep it as the package and import from it consistently. Do not create a duplicate `trust_geo` package unless migration is explicitly required.

Keep UI, schemas, verification rules, agent integration, benchmark logic and persistence in separate modules.

## 6. Data Models

Create validated models for the following entities.

### Claim

Include:
- case_id
- claim_text
- event_type
- area_of_interest
- claim_start
- claim_end

### Evidence

Include:
- evidence_id
- source_type
- source_id
- source_url
- acquired_at
- published_at
- geometry
- bbox
- metadata
- content
- provenance

### Finding

Include:
- check_name
- status
- severity
- evidence_ids
- explanation
- details

### VerificationResult

Include:
- run_id
- case_id
- workflow_mode
- verdict
- findings
- evidence_ids
- timestamp
- synthetic_demo

Use timezone-aware ISO 8601 timestamps. Validate date ranges, identifiers, allowed enums and required fields.

Keep acquisition dates separate from publication dates. Never infer an event date solely from a report's publication date.

## 7. Single AI Agent Requirements

Implement the agent in `agent.py`.

Its responsibilities are:

1. Interpret the supplied claim.
2. Extract candidate event type, date and location.
3. Identify supporting and contradicting passages.
4. Return evidence IDs associated with those passages.
5. Provide exact quoted spans.
6. Report ambiguities and uncertainties.
7. Return structured JSON validated using Pydantic.

The agent must not:
- Invent evidence IDs, quotations, sources or facts.
- Treat missing information as negative evidence.
- Claim to have accessed sources it did not access.
- Select the final verdict.
- Execute instructions embedded in retrieved reports.
- Have unrestricted shell, filesystem or network access.

Reject malformed output, unknown evidence IDs, unsupported fields and quotations that do not occur in the referenced evidence.

Allow UNKNOWN or UNCERTAIN outcomes.

Keep the provider integration behind a small adapter so the provider can be changed without rewriting the verification engine.

Use environment variables for credentials. Never hardcode API keys or include them in logs, commits or JSON exports.

If no key is configured, clearly indicate demo mode. Never simulate a successful external model call.

## 8. Deterministic Verification Engine

Implement independent, reusable functions.

### Temporal relevance

- Compare evidence acquisition/event dates with the claim interval.
- Identify missing timestamps.
- Calculate temporal gaps.
- Use configurable, event-specific freshness thresholds.
- Preserve publication date and event date as distinct concepts.

### Spatial relevance

- Validate supplied GeoJSON geometry.
- Check whether evidence geometry intersects the claim area.
- Detect invalid or missing geometry.
- Handle ambiguous boundaries cautiously.
- Document coordinate-reference and coordinate-order assumptions.

### Metadata completeness

- Define required fields by source type.
- Report missing, malformed or invalid metadata.
- Treat unknown values as unknown rather than proof of falsity.

### Provenance

Record available source identifiers, URLs, catalogue names, retrieval timestamps and other relevant provenance.

Traceability does not automatically establish source credibility.

### Contradiction detection

- Flag opposing structured evidence about the same event, location and time.
- Preserve both sides of the conflict.
- Do not automatically decide which source is correct.

### Prompt-injection handling

Treat all retrieved documents as untrusted data, not instructions.

Keep system instructions separate from evidence. Validate outputs and restrict agent capabilities.

Prompt-injection detection warnings are supplementary controls, not a guarantee of protection.

Every check must return a structured Finding object.

## 9. Final Verdict Policy

Allow exactly four final verdicts:

- `SUPPORTED`
- `REFUTED`
- `INSUFFICIENT_EVIDENCE`
- `NEEDS_REVIEW`

### SUPPORTED

Use only when sufficiently reliable, relevant evidence supports the claim for the same place and time and material contradictions are resolved.

### REFUTED

Use only when credible, relevant, direct counterevidence contradicts the claim for the same place and time.

### INSUFFICIENT_EVIDENCE

Use when evidence is absent, stale, incomplete, geographically mismatched or materially conflicting.

### NEEDS_REVIEW

Use when event interpretation, source credibility or geographical meaning remains ambiguous.

Do not equate stale evidence, missing metadata, model confidence or an absent source with proof that a claim is false.

Every verdict must include an explanation, relevant evidence IDs, findings and unresolved uncertainties.

When evidence is inadequate, abstain rather than invent certainty.

## 10. Baseline and Protected Workflows

Implement two comparable workflows.

### Baseline

A simple reference workflow without the additional protected verification layer.

### Protected

The workflow using deterministic checks, the single AI agent when configured, output validation and the Python verdict policy.

Both workflows must receive identical claim and evidence inputs.

Do not deliberately cripple the baseline to manufacture an improvement.

Record the actual behaviour of each workflow.

## 11. Benchmark Requirements

Create 12 labelled synthetic test cases covering:

1. Correct date and area with supporting evidence.
2. Stale satellite imagery.
3. Wrong geographical area.
4. Missing acquisition timestamp.
5. Contradictory reports.
6. No evidence.
7. Prompt injection.
8. Valid evidence that must not be rejected.
9. Publication-date versus event-date confusion.
10. Ambiguous geographical boundaries.
11. Credible direct counterevidence.
12. Unclear source credibility.

Freeze expected labels before executing the workflows.

Measure:
- Verdict accuracy.
- Failure recall.
- False alarm rate.
- Appropriate abstention.
- Evidence traceability.
- Execution latency.
- Token usage and API cost when available.

Show numerators, denominators and sample sizes. Handle undefined metrics without division-by-zero errors.

Do not fabricate benchmark results or claim measured improvements before running the tests.

Synthetic benchmark results must be labelled as synthetic.

## 12. Database and Audit Trail

Use SQLite for persistent records.

Store relevant:
- Claims and case identifiers.
- Evidence records or permitted snapshots.
- Verification runs.
- Verdicts and findings.
- Workflow and model versions.
- Timestamps and execution latency.
- Benchmark metrics.

Use parameterised SQL queries and appropriate database constraints.

Provide JSON export for verification runs and benchmark results.

Never include API secrets in saved records or exports.

Handle database errors clearly and preserve audit consistency.

## 13. User Interface

Build a clean, professional Streamlit interface with these sections:

1. Overview.
2. Claim submission.
3. Evidence ledger.
4. Verification findings.
5. Baseline-versus-protected comparison.
6. Benchmark results.
7. Audit history and JSON export.

Show the source, evidence ID, acquisition date, publication date, footprint, metadata and content when available.

Use clear labels for pass, warning, error and review states.

Include loading indicators, empty states, actionable errors and a demo reset option.

Clearly distinguish:
- Synthetic demonstration evidence.
- Live catalogue metadata.
- Actual LLM responses.
- Deterministic demo results.

Do not show fabricated live results or pretend an integration is connected when it is not.

## 14. Optional Satellite Integration

Only add live STAC integration after the fixture-based backend, verification engine and tests work.

Use `pystac-client` with the configured Earth Search STAC API.

Search by geographical area and date range. Normalise returned metadata into the existing Evidence schema.

Handle timeouts, empty results, API errors, missing metadata and inaccessible assets.

Do not download or process satellite pixels unless explicitly required later.

The existence of a satellite catalogue item does not prove that flooding or another event occurred.

Keep the synthetic demo usable when the network is unavailable.

## 15. Coding Workflow

Work incrementally.

Before editing:
1. Inspect the repository structure.
2. Read existing relevant files.
3. Identify the smallest necessary change.
4. Preserve existing working functionality.

Implement in this order:

1. Project setup and runnable application.
2. Schemas and evidence loading.
3. Deterministic verification checks.
4. Single AI agent and output validation.
5. Final verdict policy.
6. SQLite storage and JSON export.
7. Baseline and protected workflows.
8. Benchmark runner and metrics.
9. Dashboard integration.
10. Optional live STAC integration.

Do not implement all features in one enormous file or one unreviewed change.

Do not move to the next milestone until the current milestone has been tested.

## 16. Testing and Quality Requirements

Use pytest.

For each implementation milestone:

1. Run the relevant tests.
2. Fix failures caused by the changes.
3. Test missing, malformed and boundary-case inputs.
4. Verify imports and module paths.
5. Report commands executed and actual outcomes.
6. List any remaining issues honestly.

Never claim tests passed unless they actually ran.

Do not suppress exceptions silently or replace backend failures with fabricated successful results.

Use clear function names, type hints, docstrings and focused modules.

Update README.md when setup, dependencies, configuration or commands change.

## 17. Environment and Security

- Use `.env.example` for variable names and placeholder values.
- Keep `.env`, API keys, credentials, local databases and sensitive outputs out of Git.
- Never print secrets.
- Use timeouts and bounded retries for external calls.
- Validate all user input and model output.
- Apply reasonable input-size limits.
- Treat external evidence as untrusted.
- Avoid unnecessary permissions and external service calls.
- Respect data-source licences and terms.
- Do not introduce additional infrastructure without justification.

## 18. Instructions for Antigravity

You are the coding assistant for the TRUST-GEO repository.

Follow these rules for every task:

1. Inspect existing files before making changes.
2. Make changes only within the requested scope.
3. Preserve working code and existing user changes.
4. Use exactly one AI agent.
5. Keep final verdict logic in Python.
6. Implement real functionality rather than mock success responses.
7. Use synthetic data until a live integration is verified.
8. Add tests for new functionality.
9. Run relevant tests and report the actual results.
10. Never fabricate execution results, data sources or measured improvements.
11. Explain important file changes and provide exact commands.
12. Ask for clarification before destructive changes or major architectural migrations.

When asked to implement a feature, make the code changes rather than returning only a proposed plan, unless the user explicitly asks for a plan first.

## 19. Definition of Done

The initial TRUST-GEO prototype is ready for demonstration when:

- The application launches successfully.
- Claims and evidence are validated.
- Deterministic temporal, spatial and metadata checks work.
- One AI agent can extract structured candidate information when configured.
- Agent outputs are validated against supplied evidence.
- The Python verdict policy returns one of the four allowed verdicts.
- Baseline and protected workflows can run on identical test cases.
- The benchmark calculates metrics from actual executions.
- SQLite stores audit records and JSON export works.
- The dashboard presents real outputs and uncertainties.
- Tests run successfully and results are documented.
- Synthetic data and optional live integrations are clearly distinguished.

Passing these checks demonstrates a functioning prototype, not proven real-world geospatial reliability.

**Core principle: The AI agent interprets evidence; Python validates it; the verdict policy makes the final decision.**