"""Tests for the HTTP server: real requests against a server on a free local port."""

import json
import threading
import urllib.error
import urllib.request

import pytest

from backend import api, server


@pytest.fixture
def base_url():
    srv = server.make_server("127.0.0.1", 0)
    thread = threading.Thread(target=srv.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()
    srv.server_close()


def call(base_url, method, path, body=None, origin=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base_url + path, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if origin:
        req.add_header("Origin", origin)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read() or b"null"), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null"), dict(e.headers)


def test_health_and_cases(base_url):
    assert call(base_url, "GET", "/api/health")[1]["status"] == "ok"
    status, cases, _ = call(base_url, "GET", "/api/cases")
    assert status == 200 and len(cases) == 12
    status, case, _ = call(base_url, "GET", "/api/cases/C02")
    assert status == 200 and case["expected_verdict"] == "INSUFFICIENT_EVIDENCE"


def test_run_case_and_export(base_url):
    status, result, _ = call(base_url, "POST", "/api/cases/C02/run", {"mode": "protected"})
    assert status == 200 and result["verdict"] == "INSUFFICIENT_EVIDENCE"
    status, record, _ = call(base_url, "GET", f"/api/runs/{result['run_id']}/export")
    assert status == 200 and record["result"]["run_id"] == result["run_id"]
    status, runs, _ = call(base_url, "GET", "/api/runs?case_id=C02&limit=5")
    assert runs[0]["run_id"] == result["run_id"]


def test_dashboard_is_real_data(base_url):
    call(base_url, "POST", "/api/cases/C07/run", {"mode": "protected"})
    status, dash, _ = call(base_url, "GET", "/api/dashboard")
    assert status == 200
    assert dash["synthetic"] is True
    assert dash["stats"]["cases_tested"] == 12
    assert dash["stats"]["protected_accuracy"]["denominator"] == 12
    assert dash["stats"]["evidence_conflicts"] == 1
    tags = {m["tag"] for m in dash["failure_modes"]}
    assert {"stale_imagery", "prompt_injection", "contradiction"} <= tags
    assert dash["recent_runs"][0]["case_id"] == "C07"
    assert any(f["code"] == "INJECTION_SUSPECTED" for f in dash["recent_findings"])
    assert dash["aoi"]["bbox"] == [77.15, 28.55, 77.25, 28.65]


def test_benchmark_ablation_reset(base_url):
    status, report, _ = call(base_url, "POST", "/api/benchmark")
    assert status == 200 and report["n_cases"] == 12
    assert call(base_url, "GET", "/api/ablation")[0] == 200
    assert call(base_url, "POST", "/api/reset")[1] == {"reset": True}
    assert call(base_url, "GET", "/api/runs")[1] == []


def test_acquisitions_uses_cache_offline(base_url, monkeypatch):
    def offline(bbox, date):
        from backend.evidence_loader import nearest_acquisitions
        return nearest_acquisitions(bbox, date, search_fn=lambda *a: (_ for _ in ()).throw(ConnectionError("x")))
    monkeypatch.setattr(api, "nearest_acquisitions", offline)
    status, acq, _ = call(base_url, "GET", "/api/acquisitions?bbox=77.15,28.55,77.25,28.65&date=2026-10-20")
    assert status == 200 and acq["source"] == "cached"


@pytest.mark.parametrize("method,path,body,expected", [
    ("GET", "/api/cases/C99", None, 404),
    ("GET", "/api/nope", None, 404),
    ("POST", "/api/cases", None, 405),
    ("POST", "/api/cases/C01/run", {"mode": "turbo"}, 400),
    ("POST", "/api/cases/C01/run", None, 400),
    ("GET", "/api/runs/does-not-exist/export", None, 404),
    ("GET", "/api/acquisitions?bbox=1,2,3&date=2026-10-20", None, 400),
    ("GET", "/api/acquisitions?bbox=a,b,c,d&date=2026-10-20", None, 400),
    ("GET", "/api/acquisitions", None, 400),
    ("GET", "/api/runs?limit=abc", None, 400),
    ("GET", "/api/runs?limit=0", None, 400),
])
def test_errors_are_json_with_correct_status(base_url, method, path, body, expected):
    status, payload, _ = call(base_url, method, path, body)
    assert status == expected
    assert "error" in payload


def test_bad_json_body(base_url):
    req = urllib.request.Request(base_url + "/api/cases/C01/run", data=b"{not json", method="POST")
    with pytest.raises(urllib.error.HTTPError) as e:
        urllib.request.urlopen(req, timeout=10)
    assert e.value.code == 400


def test_cors_only_for_allowed_origins(base_url):
    _, _, headers = call(base_url, "GET", "/api/health", origin="http://localhost:5173")
    assert headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
    _, _, headers = call(base_url, "GET", "/api/health", origin="http://evil.example")
    assert "Access-Control-Allow-Origin" not in headers


def test_evidence_route(base_url):
    status, evidence, _ = call(base_url, "GET", "/api/evidence")
    assert status == 200 and len(evidence) == 19


def _get_raw(url):
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return resp.status, resp.headers.get("Content-Type"), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Content-Type"), e.read()


@pytest.fixture
def built_frontend(tmp_path, monkeypatch):
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<!doctype html><div id=root></div>", encoding="utf-8")
    (dist / "assets" / "app.js").write_text("console.log(1)", encoding="utf-8")
    (tmp_path / "secret.txt").write_text("do not serve", encoding="utf-8")
    monkeypatch.setattr(server, "STATIC_DIR", dist)
    return dist


def test_serves_frontend_and_spa_fallback(base_url, built_frontend):
    status, ctype, body = _get_raw(base_url + "/")
    assert status == 200 and "text/html" in ctype and b"id=root" in body
    status, ctype, body = _get_raw(base_url + "/assets/app.js")
    assert status == 200 and "javascript" in ctype and body == b"console.log(1)"
    status, _, body = _get_raw(base_url + "/comparison")
    assert status == 200 and b"id=root" in body


def test_static_never_escapes_dist(base_url, built_frontend):
    status, _, body = _get_raw(base_url + "/..%2Fsecret.txt")
    assert b"do not serve" not in body
    status, _, body = _get_raw(base_url + "/../secret.txt")
    assert b"do not serve" not in body


def test_api_routes_still_json_when_frontend_built(base_url, built_frontend):
    assert call(base_url, "GET", "/api/health")[1]["status"] == "ok"
    assert call(base_url, "GET", "/api/nope")[0] == 404


def test_missing_frontend_build_is_clear(base_url, tmp_path, monkeypatch):
    monkeypatch.setattr(server, "STATIC_DIR", tmp_path / "no-dist")
    status, payload, _ = call(base_url, "GET", "/")
    assert status == 404 and "not built" in payload["error"]
