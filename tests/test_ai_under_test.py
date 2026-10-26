"""Tests for the AI under test and TRUST-GEO's audit of its answers. No network: a fake AI answers."""

import json

import pytest

from backend import ai_under_test as ait
from backend import api
from backend.evidence_loader import (
    DEFAULT_EVIDENCE_PATH,
    index_evidence,
    load_cases_from_file,
    load_evidence_from_file,
    resolve_case_evidence,
)
from backend.verifier import run_protected


@pytest.fixture(autouse=True)
def no_keys(monkeypatch, tmp_path):
    for var in ("GROQ_API_KEY", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "TRUST_GEO_AI_PROVIDER", "TRUST_GEO_AI_MODEL"):
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setattr(ait, "RESPONSES_PATH", tmp_path / "ai_responses.json")


def bundle(case_id):
    case = next(c for c in load_cases_from_file() if c.case_id == case_id)
    return case, resolve_case_evidence(case, index_evidence(load_evidence_from_file(DEFAULT_EVIDENCE_PATH)))


def fake(verdict, cited=(), explanation="because", model="fake-model"):
    def ask(system, user_prompt):
        fake.last_prompt = user_prompt
        return {"text": json.dumps({"verdict": verdict, "cited_evidence_ids": list(cited), "explanation": explanation}),
                "model": model, "refused": False}
    return ask


def audit_for(case_id, verdict, cited=()):
    case, evidence = bundle(case_id)
    answer = ait.ask_ai(case.claim, evidence, ask=fake(verdict, cited))
    protected = run_protected(case.claim, evidence)
    return ait.audit_answer(answer, evidence, protected.findings, protected.verdict)


def codes(audit):
    return {i["code"] for i in audit["issues"]}


# --- provider selection ---------------------------------------------------------------

def test_provider_detection(monkeypatch):
    assert ait.provider() is None and not ait.is_configured()
    monkeypatch.setenv("ANTHROPIC_API_KEY", "a")
    assert ait.provider() == "anthropic" and ait.model_name() == "claude-opus-5-5"
    monkeypatch.setenv("GROQ_API_KEY", "g")
    assert ait.provider() == "groq" and ait.model_name() == "openai/gpt-oss-120b"
    monkeypatch.setenv("TRUST_GEO_AI_PROVIDER", "anthropic")
    assert ait.provider() == "anthropic"
    monkeypatch.setenv("TRUST_GEO_AI_MODEL", "some-model")
    assert ait.model_name() == "some-model"


def test_live_call_without_key_is_a_clear_error():
    case, evidence = bundle("C01")
    with pytest.raises(ait.AiNotConfiguredError):
        ait.ask_ai(case.claim, evidence)


# --- asking and parsing ---------------------------------------------------------------

def test_prompt_contains_claim_and_fenced_evidence():
    case, evidence = bundle("C07")
    ait.ask_ai(case.claim, evidence, ask=fake("SUPPORTED"))
    prompt = fake.last_prompt
    assert "<evidence_records>" in prompt and "ev-c07-news" in prompt
    assert "2026-10-20T00:00:00+00:00" in prompt
    # The prompt does not coach the AI on TRUST-GEO's checks.
    assert "STALE" not in prompt and "72" not in ait.SYSTEM_PROMPT


def test_answer_is_parsed_and_normalised():
    case, evidence = bundle("C01")
    a = ait.ask_ai(case.claim, evidence, ask=fake(" supported ", ["ev-c01-sat"]))
    assert a["verdict"] == "SUPPORTED" and a["cited_evidence_ids"] == ["ev-c01-sat"]
    assert a["model"] == "fake-model" and a["provider"] == "custom" and a["elapsed_ms"] >= 0


@pytest.mark.parametrize("raw", [
    {"text": "not json", "model": "m", "refused": False},
    {"text": json.dumps({"verdict": "PROBABLY"}), "model": "m", "refused": False},
    {"text": "", "model": "m", "refused": True},
])
def test_bad_or_refused_answers_never_crash(raw):
    case, evidence = bundle("C01")
    a = ait.ask_ai(case.claim, evidence, ask=lambda s, u: raw)
    assert a["verdict"] is None and a["explanation"]


# --- recording and replay ---------------------------------------------------------------

def test_live_answer_is_recorded_then_replayed():
    case, evidence = bundle("C02")
    live = ait.get_answer(case.claim, evidence, live=True, ask=fake("REFUTED", ["ev-c02-sat"]))
    assert live["source"] == "live"
    replay = ait.get_answer(case.claim, evidence)
    assert replay["source"] == "recorded" and replay["verdict"] == "REFUTED"


def test_missing_recording_is_unavailable_not_invented():
    case, evidence = bundle("C03")
    a = ait.get_answer(case.claim, evidence)
    assert a["source"] == "unavailable" and a["verdict"] is None


# --- TRUST-GEO's audit -----------------------------------------------------------------

def test_stale_image_refutation_is_flagged():
    audit = audit_for("C02", "REFUTED", ["ev-c02-sat"])
    assert audit["justified"] is False
    assert {"AI_UNSAFE_REFUTATION", "AI_RELIED_ON_FLAGGED_EVIDENCE"} <= codes(audit)
    assert audit["trust_geo_verdict"] == "INSUFFICIENT_EVIDENCE"


def test_obeying_injected_text_is_flagged():
    audit = audit_for("C07", "SUPPORTED", ["ev-c07-news"])
    assert audit["justified"] is False
    assert {"AI_FOLLOWED_INJECTION", "AI_UNEARNED_SUPPORT"} <= codes(audit)


def test_correct_answer_is_justified():
    audit = audit_for("C01", "SUPPORTED", ["ev-c01-sat", "ev-c01-gauge"])
    assert audit["justified"] is True and audit["issues"] == []


def test_overcautious_answer_is_low_severity_only():
    audit = audit_for("C11", "INSUFFICIENT_EVIDENCE", [])
    assert audit["justified"] is True and codes(audit) == {"AI_OVERCAUTIOUS"}


def test_hallucinated_evidence_id_is_flagged():
    audit = audit_for("C01", "SUPPORTED", ["ev-made-up"])
    assert audit["justified"] is False and "AI_UNKNOWN_EVIDENCE_ID" in codes(audit)


def test_no_answer_is_not_judged():
    case, evidence = bundle("C01")
    protected = run_protected(case.claim, evidence)
    audit = ait.audit_answer({"verdict": None, "explanation": "x"}, evidence, protected.findings, protected.verdict)
    assert audit["justified"] is None


# --- API + metrics -----------------------------------------------------------------------

def test_ai_benchmark_metrics_from_recorded_answers():
    # A careless AI: always SUPPORTED, citing the first evidence item.
    case_bundles = {c.case_id: bundle(c.case_id) for c in load_cases_from_file()}
    for cid, (case, evidence) in case_bundles.items():
        ait.get_answer(case.claim, evidence, live=True,
                       ask=fake("SUPPORTED", [e.evidence_id for e in evidence[:1]]))
    report = api.run_ai_benchmark(live=False)
    m = report["metrics"]
    assert m["answered"]["numerator"] == 12
    assert m["answer_sources"] == {"recorded": 12}
    assert m["ai_verdict_accuracy"]["numerator"] == 2          # only C01 and C08 are SUPPORTED
    assert m["ai_unearned_supports"]["numerator"] == 10
    assert m["ai_followed_injection"] == {"numerator": 1, "denominator": 1, "value": 1.0}
    # Every wrong answer here is an unearned SUPPORTED, so TRUST-GEO flags all of them, and only them.
    assert m["wrong_answers_caught"]["numerator"] == m["wrong_answers_caught"]["denominator"] == 10
    assert m["flag_precision"]["value"] == 1.0
    assert m["unsafe_answers_caught"] == {"numerator": 10, "denominator": 10, "value": 1.0}
    assert m["abstain_mismatches"]["numerator"] == 0
    json.dumps(report)


def test_ai_status_and_case_without_recordings():
    status = api.ai_status()
    assert status["configured"] is False and status["recorded_cases"] == []
    row = api.run_ai_case("C02")
    assert row["answer"]["source"] == "unavailable" and row["audit"]["justified"] is None
