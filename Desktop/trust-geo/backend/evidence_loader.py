"""Evidence and claim loader module with comprehensive validation and descriptive error reporting."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Union
from pydantic import ValidationError

from backend.schemas import BenchmarkCase, Claim, Evidence


class EvidenceLoadError(Exception):
    """Raised when loading or validating evidence fails."""
    pass


class ClaimLoadError(Exception):
    """Raised when loading or validating a claim fails."""
    pass


def format_validation_error(err: ValidationError, context: str = "") -> str:
    """Format Pydantic validation errors into readable human-friendly diagnostics."""
    messages = []
    for error in err.errors():
        loc = " -> ".join(str(elem) for elem in error.get("loc", []))
        msg = error.get("msg", "Validation error")
        error_type = error.get("type", "")
        messages.append(f"  - Field '{loc}': {msg} (type: {error_type})")
    prefix = f"Validation failed for {context}:\n" if context else "Validation failed:\n"
    return prefix + "\n".join(messages)


def load_evidence_from_dict(item: Dict[str, Any], index: int = 0) -> Evidence:
    """Validate and instantiate a single Evidence model from a dictionary."""
    ev_id = item.get("evidence_id", f"item_{index}")
    try:
        return Evidence.model_validate(item)
    except ValidationError as e:
        formatted = format_validation_error(e, context=f"Evidence item #{index} (id: '{ev_id}')")
        raise EvidenceLoadError(formatted) from e


def load_evidence_from_json(json_str: str) -> List[Evidence]:
    """Parse JSON string and validate a list or single Evidence object."""
    if not json_str or not json_str.strip():
        raise EvidenceLoadError("Input JSON string is empty.")

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise EvidenceLoadError(
            f"Invalid JSON syntax at line {e.lineno}, column {e.colno}: {e.msg}"
        ) from e

    if isinstance(data, dict):
        # Support single evidence object or dictionary with an 'evidence' key
        if "evidence" in data and isinstance(data["evidence"], list):
            items = data["evidence"]
        else:
            items = [data]
    elif isinstance(data, list):
        items = data
    else:
        raise EvidenceLoadError(f"Expected a JSON object or array of evidence, got {type(data).__name__}.")

    evidence_list: List[Evidence] = []
    errors: List[str] = []

    for i, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"  - Item #{i}: Expected dictionary, got {type(item).__name__}")
            continue
        try:
            evidence_list.append(load_evidence_from_dict(item, index=i))
        except EvidenceLoadError as err:
            errors.append(str(err))

    if errors:
        raise EvidenceLoadError(
            f"Failed to load {len(errors)} evidence item(s):\n" + "\n".join(errors)
        )

    return evidence_list


def load_evidence_from_file(file_path: Union[str, Path]) -> List[Evidence]:
    """Read a JSON file from disk and return a validated list of Evidence objects."""
    path = Path(file_path)
    if not path.exists():
        raise EvidenceLoadError(f"Evidence file not found: {path.resolve()}")
    if not path.is_file():
        raise EvidenceLoadError(f"Path is not a regular file: {path.resolve()}")

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        raise EvidenceLoadError(f"Failed to read file {path.resolve()}: {e}") from e

    return load_evidence_from_json(content)


def load_claim_from_dict(data: Dict[str, Any]) -> Claim:
    """Validate and instantiate a Claim model from a dictionary."""
    case_id = data.get("case_id", "unknown_case")
    try:
        return Claim.model_validate(data)
    except ValidationError as e:
        formatted = format_validation_error(e, context=f"Claim (case_id: '{case_id}')")
        raise ClaimLoadError(formatted) from e


def load_claims_from_file(file_path: Union[str, Path]) -> List[Claim]:
    """Read a JSON file containing one or more claims and return validated Claim objects."""
    path = Path(file_path)
    if not path.exists():
        raise ClaimLoadError(f"Claims file not found: {path.resolve()}")
    if not path.is_file():
        raise ClaimLoadError(f"Path is not a regular file: {path.resolve()}")

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        raise ClaimLoadError(f"Failed to read file {path.resolve()}: {e}") from e

    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise ClaimLoadError(
            f"Invalid JSON syntax in claims file at line {e.lineno}, column {e.colno}: {e.msg}"
        ) from e

    if isinstance(data, dict):
        if "claims" in data and isinstance(data["claims"], list):
            items = data["claims"]
        else:
            items = [data]
    elif isinstance(data, list):
        items = data
    else:
        raise ClaimLoadError(f"Expected a JSON object or array of claims, got {type(data).__name__}.")

    claims_list: List[Claim] = []
    errors: List[str] = []

    for i, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"  - Item #{i}: Expected dictionary, got {type(item).__name__}")
            continue
        try:
            claims_list.append(load_claim_from_dict(item))
        except ClaimLoadError as err:
            errors.append(str(err))

    if errors:
        raise ClaimLoadError(
            f"Failed to load {len(errors)} claim item(s):\n" + "\n".join(errors)
        )

    return claims_list


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_CASES_PATH = DATA_DIR / "test_cases.json"
DEFAULT_EVIDENCE_PATH = DATA_DIR / "synthetic_evidence.json"


class CaseLoadError(Exception):
    """Raised when loading or validating benchmark cases fails."""
    pass


def load_cases_from_file(file_path: Union[str, Path] = DEFAULT_CASES_PATH) -> List[BenchmarkCase]:
    """Read a JSON array of labelled benchmark cases and return validated BenchmarkCase objects."""
    path = Path(file_path)
    if not path.is_file():
        raise CaseLoadError(f"Cases file not found: {path.resolve()}")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise CaseLoadError(
            f"Invalid JSON syntax in cases file at line {e.lineno}, column {e.colno}: {e.msg}"
        ) from e

    if not isinstance(data, list):
        raise CaseLoadError(f"Expected a JSON array of cases, got {type(data).__name__}.")

    cases: List[BenchmarkCase] = []
    errors: List[str] = []
    for i, item in enumerate(data):
        case_id = item.get("case_id", f"item_{i}") if isinstance(item, dict) else f"item_{i}"
        try:
            cases.append(BenchmarkCase.model_validate(item))
        except ValidationError as e:
            errors.append(format_validation_error(e, context=f"Case #{i} (case_id: '{case_id}')"))

    if errors:
        raise CaseLoadError(f"Failed to load {len(errors)} case(s):\n" + "\n".join(errors))

    ids = [c.case_id for c in cases]
    duplicates = sorted({cid for cid in ids if ids.count(cid) > 1})
    if duplicates:
        raise CaseLoadError(f"Duplicate case_id(s): {', '.join(duplicates)}")

    return cases


def index_evidence(evidence_list: List[Evidence]) -> Dict[str, Evidence]:
    """Index evidence by ID, rejecting duplicate IDs."""
    index: Dict[str, Evidence] = {}
    for ev in evidence_list:
        if ev.evidence_id in index:
            raise EvidenceLoadError(f"Duplicate evidence_id: '{ev.evidence_id}'")
        index[ev.evidence_id] = ev
    return index


def resolve_case_evidence(case: BenchmarkCase, evidence_index: Dict[str, Evidence]) -> List[Evidence]:
    """Return the evidence bundle for a case, in the case's order. Unknown IDs are an error, never skipped."""
    missing = [eid for eid in case.evidence_ids if eid not in evidence_index]
    if missing:
        raise CaseLoadError(f"Case '{case.case_id}' references unknown evidence ID(s): {', '.join(missing)}")
    return [evidence_index[eid] for eid in case.evidence_ids]


# ============================================================================
# STAC catalogue search (real metadata only, never pixels) with cached fallback
# ============================================================================

EARTH_SEARCH_URL = "https://earth-search.aws.element84.com/v1"
DEFAULT_COLLECTION = "sentinel-2-l2a"
STAC_CACHE_PATH = DATA_DIR / "stac_cache.json"
STAC_TIMEOUT_SECONDS = 15.0

SearchFn = Callable[[List[float], str, str], List[Dict[str, Any]]]


class AcquisitionLookupError(Exception):
    """Raised for invalid nearest-acquisition requests (bad bbox or date)."""


def _validate_bbox(bbox: List[float]) -> List[float]:
    if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
        raise AcquisitionLookupError(f"bbox must be [min_lon, min_lat, max_lon, max_lat], got {bbox!r}")
    try:
        min_lon, min_lat, max_lon, max_lat = (float(v) for v in bbox)
    except (TypeError, ValueError) as e:
        raise AcquisitionLookupError(f"bbox must be numeric: {e}") from e
    if not (-180 <= min_lon <= max_lon <= 180 and -90 <= min_lat <= max_lat <= 90):
        raise AcquisitionLookupError(f"bbox out of WGS84 range or min > max: {bbox!r}")
    return [min_lon, min_lat, max_lon, max_lat]


def _search_earth_search(bbox: List[float], datetime_range: str, collection: str) -> List[Dict[str, Any]]:
    """Live STAC search. Returns minimal item metadata dicts. Raises on any network/API error."""
    from pystac_client import Client

    client = Client.open(EARTH_SEARCH_URL, timeout=STAC_TIMEOUT_SECONDS)
    search = client.search(collections=[collection], bbox=bbox, datetime=datetime_range, max_items=500)
    items = []
    for item in search.items_as_dicts():
        props = item.get("properties", {})
        items.append({
            "item_id": item.get("id"),
            "acquired_at": props.get("datetime"),
            "cloud_cover_pct": props.get("eo:cloud_cover"),
            "platform": props.get("platform"),
            "collection": item.get("collection", collection),
            "url": f"{EARTH_SEARCH_URL}/collections/{item.get('collection', collection)}/items/{item.get('id')}",
        })
    return items


def _nearest(items: List[Dict[str, Any]], target: date) -> Dict[str, Any]:
    """Pick the nearest pass on/before and after the target date. gap_days uses calendar dates."""
    before = after = None
    for it in items:
        if not it.get("acquired_at"):
            continue  # missing acquisition time is unknown, never guessed
        acq = datetime.fromisoformat(str(it["acquired_at"]).replace("Z", "+00:00"))
        gap = (target - acq.date()).days
        entry = {**it, "acquired_at": acq.isoformat(), "gap_days": abs(gap)}
        if gap >= 0:
            if before is None or acq > datetime.fromisoformat(before["acquired_at"]):
                before = entry
        elif after is None or acq < datetime.fromisoformat(after["acquired_at"]):
            after = entry
    return {"before": before, "after": after}


def _read_cache(cache_path: Path) -> Dict[str, Any]:
    try:
        return json.loads(cache_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def nearest_acquisitions(
    bbox: List[float],
    date_str: str,
    collection: str = DEFAULT_COLLECTION,
    window_days: int = 30,
    search_fn: Optional[SearchFn] = None,
    cache_path: Union[str, Path] = STAC_CACHE_PATH,
) -> Dict[str, Any]:
    """Nearest real satellite passes before (or on) and after a date over a bbox.

    Tries the live catalogue first and caches the answer. If live search fails, returns the cached
    answer labelled "cached". If neither is available, returns source "unavailable" with no passes.
    A catalogue item proves only that a pass happened, not that any event occurred.
    """
    box = _validate_bbox(bbox)
    try:
        target = date.fromisoformat(date_str)
    except (TypeError, ValueError) as e:
        raise AcquisitionLookupError(f"date must be YYYY-MM-DD, got {date_str!r}") from e

    start = (target - timedelta(days=window_days)).isoformat()
    end = (target + timedelta(days=window_days)).isoformat()
    key = f"{collection}|{','.join(f'{v:g}' for v in box)}|{target.isoformat()}|{window_days}"
    base = {"bbox": box, "date": target.isoformat(), "collection": collection, "window_days": window_days,
            "note": "Catalogue metadata only. A pass shows the area was imaged, not that an event occurred."}

    try:
        items = (search_fn or _search_earth_search)(box, f"{start}T00:00:00Z/{end}T23:59:59Z", collection)
        result = {**base, **_nearest(items, target), "items_found": len(items),
                  "retrieved_at": datetime.now(timezone.utc).isoformat()}
        cache = _read_cache(Path(cache_path))
        cache[key] = result
        try:
            Path(cache_path).write_text(json.dumps(cache, indent=2) + "\n", encoding="utf-8")
        except OSError:
            pass  # a cache write failure must not hide a successful live result
        return {**result, "source": "live"}
    except Exception as e:  # network, timeout, API or parsing error
        cached = _read_cache(Path(cache_path)).get(key)
        if cached:
            return {**cached, "source": "cached", "live_error": f"{type(e).__name__}: {e}"}
        return {**base, "before": None, "after": None, "items_found": 0, "source": "unavailable",
                "live_error": f"{type(e).__name__}: {e}"}
