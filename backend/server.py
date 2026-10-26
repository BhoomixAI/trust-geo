"""HTTP JSON server for the React frontend. A thin wrapper: every route calls one backend.api function.

Standard library only (http.server). Run:  python -m backend.server [--port 8000]

Routes (all JSON):
  GET  /api/health
  GET  /api/dashboard
  GET  /api/cases
  GET  /api/evidence
  GET  /api/cases/{case_id}
  POST /api/cases/{case_id}/run          body: {"mode": "baseline" | "protected"}
  POST /api/benchmark
  GET  /api/ablation
  GET  /api/acquisitions?bbox=minlon,minlat,maxlon,maxlat&date=YYYY-MM-DD
  GET  /api/runs?case_id=&limit=
  GET  /api/runs/{run_id}/export
  POST /api/reset

Any other GET path serves the built React app from STATIC_DIR (FRONTEND/dist by default) when it
exists, falling back to index.html so the single-page app loads on every route. In production
(e.g. Render) run:  python -m backend.server --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse

from backend import __version__, api, storage
from backend.evidence_loader import AcquisitionLookupError, CaseLoadError, EvidenceLoadError

MAX_BODY_BYTES = 64 * 1024

# Built frontend to serve for non-API paths. Override with TRUST_GEO_STATIC_DIR.
STATIC_DIR = Path(
    os.environ.get("TRUST_GEO_STATIC_DIR", Path(__file__).resolve().parent.parent / "FRONTEND" / "dist")
)

# Browser origins allowed to call the API (Vite dev server by default). Comma-separated override.
ALLOWED_ORIGINS = {
    o.strip()
    for o in os.environ.get(
        "TRUST_GEO_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
}


class HttpError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


def _query(qs: Dict[str, List[str]], name: str, default: Optional[str] = None) -> Optional[str]:
    values = qs.get(name)
    return values[0] if values else default


def _int_query(qs: Dict[str, List[str]], name: str, default: int) -> int:
    raw = _query(qs, name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError as e:
        raise HttpError(400, f"'{name}' must be an integer") from e
    if not 1 <= value <= 1000:
        raise HttpError(400, f"'{name}' must be between 1 and 1000")
    return value


def _acquisitions(qs: Dict[str, List[str]]) -> Any:
    bbox_raw, date = _query(qs, "bbox"), _query(qs, "date")
    if not bbox_raw or not date:
        raise HttpError(400, "bbox and date query parameters are required")
    try:
        bbox = [float(v) for v in bbox_raw.split(",")]
    except ValueError as e:
        raise HttpError(400, "bbox must be four comma-separated numbers") from e
    return api.nearest_acquisitions(bbox, date)


def _run_case(case_id: str, body: Dict[str, Any]) -> Any:
    mode = body.get("mode")
    if mode not in api.MODES:
        raise HttpError(400, f"body.mode must be one of {list(api.MODES)}")
    return api.run_case(case_id, mode)


Handler = Callable[[Tuple[str, ...], Dict[str, List[str]], Dict[str, Any]], Any]

ROUTES: List[Tuple[str, re.Pattern, Handler]] = [
    ("GET", re.compile(r"^/api/health$"), lambda m, q, b: {"status": "ok", "synthetic_demo": True, "version": __version__}),
    ("GET", re.compile(r"^/api/dashboard$"), lambda m, q, b: api.dashboard_summary(_int_query(q, "limit", 10))),
    ("GET", re.compile(r"^/api/cases$"), lambda m, q, b: api.list_cases()),
    ("GET", re.compile(r"^/api/evidence$"), lambda m, q, b: api.list_evidence()),
    ("GET", re.compile(r"^/api/cases/([\w-]+)$"), lambda m, q, b: api.get_case(m[0])),
    ("POST", re.compile(r"^/api/cases/([\w-]+)/run$"), lambda m, q, b: _run_case(m[0], b)),
    ("POST", re.compile(r"^/api/benchmark$"), lambda m, q, b: api.run_benchmark()),
    ("GET", re.compile(r"^/api/ablation$"), lambda m, q, b: api.run_ablation()),
    ("GET", re.compile(r"^/api/acquisitions$"), lambda m, q, b: _acquisitions(q)),
    ("GET", re.compile(r"^/api/runs$"), lambda m, q, b: api.list_runs(_query(q, "case_id"), _int_query(q, "limit", 100))),
    ("GET", re.compile(r"^/api/runs/([\w-]+)/export$"), lambda m, q, b: json.loads(api.export_run(m[0]))),
    ("POST", re.compile(r"^/api/reset$"), lambda m, q, b: api.reset_demo()),
]


def dispatch(method: str, path: str, query: Dict[str, List[str]], body: Dict[str, Any]) -> Tuple[int, Any]:
    """Route a request to the API. Returns (status, json_payload). Never raises."""
    path_matched = False
    for route_method, pattern, handler in ROUTES:
        match = pattern.match(path)
        if not match:
            continue
        path_matched = True
        if route_method != method:
            continue
        try:
            return 200, handler(match.groups(), query, body)
        except HttpError as e:
            return e.status, {"error": str(e)}
        except (api.CaseNotFoundError, storage.RunNotFoundError) as e:
            return 404, {"error": str(e).strip("'\"")}
        except (ValueError, AcquisitionLookupError) as e:
            return 400, {"error": str(e)}
        except (CaseLoadError, EvidenceLoadError, storage.StorageError) as e:
            return 500, {"error": f"Backend data error: {e}"}
        except Exception as e:  # report, never hide, unexpected failures
            traceback.print_exc()
            return 500, {"error": f"Internal error: {type(e).__name__}: {e}"}
    if path_matched:
        return 405, {"error": f"Method {method} not allowed for {path}"}
    return 404, {"error": f"No route for {method} {path}"}


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "TrustGeo/1.0"

    def _cors(self) -> None:
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send(self, status: int, payload: Any) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _read_body(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length") or 0)
        if length == 0:
            return {}
        if length > MAX_BODY_BYTES:
            raise HttpError(413, "Request body too large")
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            raise HttpError(400, f"Body must be JSON: {e}") from e
        if not isinstance(body, dict):
            raise HttpError(400, "Body must be a JSON object")
        return body

    def _handle(self, method: str) -> None:
        url = urlparse(self.path)
        try:
            body = self._read_body() if method == "POST" else {}
        except HttpError as e:
            self._send(e.status, {"error": str(e)})
            return
        status, payload = dispatch(method, url.path, parse_qs(url.query), body)
        self._send(status, payload)

    def _serve_static(self, url_path: str) -> None:
        """Serve a file from the built frontend; unknown paths get index.html (single-page app)."""
        root = STATIC_DIR.resolve()
        index = root / "index.html"
        if not index.is_file():
            self._send(404, {"error": "Frontend is not built. Run 'npm run build' in FRONTEND/."})
            return
        target = (root / url_path.lstrip("/")).resolve()
        if root not in target.parents or not target.is_file():
            target = index  # path traversal, a directory, or a client-side route
        data = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        # Hashed build assets never change; index.html must always be fresh.
        cache = "public, max-age=31536000, immutable" if "/assets/" in target.as_posix() else "no-cache"
        self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:  # noqa: N802 (http.server naming)
        path = urlparse(self.path).path
        if path == "/api" or path.startswith("/api/"):
            self._handle("GET")
        else:
            self._serve_static(path)

    def do_POST(self) -> None:  # noqa: N802
        self._handle("POST")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()


def make_server(host: str = "127.0.0.1", port: int = 8000) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), RequestHandler)


def main() -> None:
    parser = argparse.ArgumentParser(description="TRUST-GEO backend HTTP server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)))
    args = parser.parse_args()
    server = make_server(args.host, args.port)
    print(f"TRUST-GEO API on http://{args.host}:{args.port}/api  (synthetic demo data; Ctrl+C to stop)", flush=True)
    if (STATIC_DIR / "index.html").is_file():
        print(f"Serving frontend from {STATIC_DIR}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
