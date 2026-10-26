"""Deterministic verification checks for geospatial evidence and claims.

Coordinate Reference System (CRS) & Ordering Convention:
- All geometries are assumed to use WGS84 (EPSG:4326).
- Coordinate order strictly follows GeoJSON RFC 7946: [longitude, latitude] ([x, y]).
- Valid longitude bounds: [-180.0, 180.0].
- Valid latitude bounds: [-90.0, 90.0].
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

from shapely.geometry import box, shape
from shapely.geometry.base import BaseGeometry
from shapely.validation import explain_validity

from backend.schemas import (
    Claim,
    Evidence,
    Finding,
    FindingSeverity,
    FindingStatus,
)

# Default freshness buffer in hours (e.g. 72 hours around sudden events like floods)
DEFAULT_FRESHNESS_HOURS: float = 72.0

# Event-specific freshness buffers in hours. Events not listed use DEFAULT_FRESHNESS_HOURS.
FRESHNESS_HOURS_BY_EVENT: Dict[str, float] = {
    "flooding": 72.0,
    "wildfire": 48.0,
    "landslide": 120.0,
    "drought": 720.0,
}


def format_duration(hours: float) -> str:
    """Human-readable duration: '7.6 days' from 48h upward, otherwise '12 hours'."""
    if hours >= 48:
        return f"{hours / 24:.1f}".rstrip("0").rstrip(".") + " days"
    return f"{hours:.0f} hour{'' if round(hours) == 1 else 's'}"


def format_moment(dt: datetime) -> str:
    """Human-readable UTC time, e.g. '12 Oct 2026, 10:20 UTC'."""
    utc = dt.astimezone(timezone.utc)
    return f"{utc.day} {utc:%b %Y, %H:%M} UTC"


def format_window(start: datetime, end: datetime) -> str:
    """Human-readable claim window: '20 Oct 2026' for a single day, otherwise a date range."""
    s, e = start.astimezone(timezone.utc), end.astimezone(timezone.utc)
    if s.date() == e.date():
        return f"{s.day} {s:%b %Y}"
    return f"{s.day} {s:%b %Y} to {e.day} {e:%b %Y}"

# Standard required metadata attributes per source type
DEFAULT_REQUIRED_METADATA: Dict[str, List[str]] = {
    "satellite": ["platform", "cloud_cover_pct", "resolution_m"],
    "news_report": ["publisher", "headline"],
    "sensor": ["sensor_type", "unit"],
    "field_report": ["observer_organization", "report_type"],
}

# Prompt injection heuristic patterns (supplementary filter - does not guarantee complete security)
INJECTION_PATTERNS: List[Tuple[str, str]] = [
    ("instruction_override", r"(?i)\b(ignore|disregard|forget|override)\s+(all\s+|any\s+|the\s+|your\s+)?((previous|prior|above|earlier|these|system)\s+)?(instructions|rules|context|guidelines|policies|checks)\b"),
    ("verdict_tampering_declare", r"(?i)\b(declare|mark|treat|label)\s+(this|the\s+claim|it)\s+(as\s+)?(verified|true|false|confirmed|supported|refuted)\b"),
    ("system_prompt_leak", r"(?i)\b(system\s+prompt|system\s+override|<system>|\[system\]|system:)\b"),
    ("persona_hijack", r"(?i)\b(you\s+are\s+now\s+a|act\s+as\s+an?\s+unrestricted|jailbreak|developer\s+mode|dan\s+mode)\b"),
    ("verdict_tampering", r"(?i)\b(output\s+(only\s+)?(supported|refuted)|set\s+verdict\s+to\s+(supported|refuted)|verdict\s*:\s*(supported|refuted))\b"),
    ("instruction_injection", r"(?i)\b(new\s+instruction|evaluator\s*:\s*|bypass\s+safety)\b"),
    ("html_code_injection", r"(?i)<!--\s*(system|instruction|override).*?-->|<\s*script\b|eval\s*\("),
]


# ============================================================================
# 1. GEOMETRY PARSING & SPATIAL CHECKS
# ============================================================================

def parse_geometry(
    geom_data: Optional[Dict[str, Any]],
    bbox: Optional[List[float]] = None,
) -> Tuple[Optional[BaseGeometry], Optional[str]]:
    """Parse and validate a GeoJSON geometry or bounding box into a Shapely geometry.

    Assumptions:
    - Coordinate Reference System: WGS84 (EPSG:4326).
    - Coordinate Order: [longitude, latitude] ([x, y]) per GeoJSON RFC 7946.
    - Longitude range: [-180.0, 180.0], Latitude range: [-90.0, 90.0].

    Returns:
    - (shapely_geom, None) if parsing and validation succeed.
    - (geom_or_none, error_message) if invalid, malformed, or missing.
    - Invalid geometry is NOT silently repaired.
    """
    if geom_data is not None:
        # Unwrap GeoJSON Feature if provided
        actual_geom = geom_data.get("geometry", geom_data) if isinstance(geom_data, dict) else geom_data
        try:
            geom = shape(actual_geom)
        except Exception as e:
            return None, f"Failed to parse GeoJSON geometry: {e}"

        # Validate geometry validity per OGC/Shapely
        if not geom.is_valid:
            validity_reason = explain_validity(geom)
            return geom, f"Invalid geometry structure ({validity_reason}). Silent repair is disabled per verification policy."

        # Verify coordinate bounds in WGS84
        minx, miny, maxx, maxy = geom.bounds
        if minx < -180.0 or maxx > 180.0 or miny < -90.0 or maxy > 90.0:
            return geom, (
                f"Coordinates out of bounds for WGS84 (EPSG:4326): "
                f"bounds [{minx}, {miny}, {maxx}, {maxy}] exceed valid range "
                "[-180, 180] longitude and [-90, 90] latitude. Check coordinate order [lon, lat]."
            )

        return geom, None

    if bbox is not None:
        if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
            return None, f"Bounding box must contain exactly 4 coordinates [min_lon, min_lat, max_lon, max_lat], got {bbox}."
        try:
            min_lon, min_lat, max_lon, max_lat = [float(x) for x in bbox]
        except (ValueError, TypeError) as e:
            return None, f"Bounding box contains non-numeric coordinates: {e}"

        if min_lon > max_lon or min_lat > max_lat:
            return None, f"Malformed bounding box: min coordinates exceed max coordinates ({bbox})."

        if min_lon < -180.0 or max_lon > 180.0 or min_lat < -90.0 or max_lat > 90.0:
            return None, (
                f"Bounding box [{min_lon}, {min_lat}, {max_lon}, {max_lat}] exceeds "
                "valid WGS84 bounds [-180, 180] longitude and [-90, 90] latitude."
            )

        try:
            geom = box(min_lon, min_lat, max_lon, max_lat)
            return geom, None
        except Exception as e:
            return None, f"Failed to construct bounding box geometry: {e}"

    return None, None


def check_spatial_relevance(claim: Claim, evidence: Evidence) -> Finding:
    """Evaluate whether evidence spatial footprint intersects the claim area of interest.

    Outcomes:
    - PASS: Evidence footprint intersects the claim area with interior overlap.
    - REVIEW: Evidence touches claim boundary without interior overlap (marginal/ambiguous).
    - FAIL: Evidence is disjoint (spatial mismatch), invalid geometry, or malformed coordinates.
    - WARN: Evidence lacks geometry and bounding box (spatial coverage unverified).

    Guarantees:
    - Never interprets a spatial mismatch alone as proof that the claim is false.
    - Does not silently repair invalid geometry.
    """
    evidence_id = evidence.evidence_id

    # Parse claim area of interest
    claim_geom, claim_err = parse_geometry(claim.area_of_interest)
    if claim_geom is None or claim_err is not None:
        return Finding(
            check_name="spatial_relevance",
            code="INVALID_AOI",
            status=FindingStatus.FAIL,
            severity=FindingSeverity.HIGH,
            evidence_ids=[evidence_id],
            explanation=f"Claim area of interest is invalid or malformed: {claim_err}",
            details={"error": claim_err, "target": "claim.area_of_interest"},
        )

    # Parse evidence geometry / bbox
    ev_geom, ev_err = parse_geometry(evidence.geometry, evidence.bbox)

    # Case 1: Missing geometry
    if ev_geom is None and ev_err is None:
        return Finding(
            check_name="spatial_relevance",
            code="SPATIAL_UNKNOWN",
            status=FindingStatus.WARN,
            severity=FindingSeverity.MEDIUM,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' lacks both GeoJSON geometry and bounding box. "
                "Spatial relevance cannot be directly verified. "
                "Missing spatial footprint does not prove the claim false."
            ),
            details={"missing_geometry": True, "source_type": evidence.source_type},
        )

    # Case 2: Malformed or invalid evidence geometry
    if ev_err is not None:
        return Finding(
            check_name="spatial_relevance",
            code="INVALID_GEOMETRY",
            status=FindingStatus.FAIL,
            severity=FindingSeverity.HIGH,
            evidence_ids=[evidence_id],
            explanation=f"Evidence '{evidence_id}' has malformed or invalid geometry: {ev_err}",
            details={"error": ev_err, "repaired": False},
        )

    assert ev_geom is not None

    # Case 3: Boundary-touching only (ambiguous boundary case)
    if claim_geom.intersects(ev_geom) and claim_geom.touches(ev_geom):
        return Finding(
            check_name="spatial_relevance",
            code="BOUNDARY_ONLY",
            status=FindingStatus.REVIEW,
            severity=FindingSeverity.MEDIUM,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' footprint touches the boundary of the claim's "
                "area of interest but does not overlap the interior. "
                "Geographical relevance is marginal or ambiguous and requires human review."
            ),
            details={
                "boundary_touching": True,
                "interior_overlap": False,
                "evidence_geom_type": ev_geom.geom_type,
                "claim_geom_type": claim_geom.geom_type,
            },
        )

    # Case 4: Positive interior intersection
    if claim_geom.intersects(ev_geom):
        intersection = claim_geom.intersection(ev_geom)
        overlap_area = getattr(intersection, "area", 0.0)
        return Finding(
            check_name="spatial_relevance",
            code="SPATIAL_OVERLAP",
            status=FindingStatus.PASS,
            severity=FindingSeverity.INFO,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' footprint spatially intersects the claim area of interest "
                f"({ev_geom.geom_type} intersecting {claim_geom.geom_type})."
            ),
            details={
                "intersects": True,
                "boundary_touching": False,
                "overlap_area_deg2": round(overlap_area, 6),
                "evidence_geom_type": ev_geom.geom_type,
                "claim_geom_type": claim_geom.geom_type,
            },
        )

    # Case 5: Disjoint (spatial mismatch)
    return Finding(
        check_name="spatial_relevance",
        code="WRONG_LOCATION",
        status=FindingStatus.FAIL,
        severity=FindingSeverity.HIGH,
        evidence_ids=[evidence_id],
        explanation=(
            f"Evidence '{evidence_id}' footprint does not intersect the claim area of interest. "
            "Note: Spatial mismatch reflects lack of spatial coverage by this specific evidence item, "
            "not proof that the claimed event did not occur."
        ),
        details={
            "intersects": False,
            "evidence_bounds": list(ev_geom.bounds),
            "claim_bounds": list(claim_geom.bounds),
            "spatial_mismatch_only": True,
        },
    )


def run_spatial_checks(claim: Claim, evidence_list: List[Evidence]) -> List[Finding]:
    """Execute spatial relevance check across all provided evidence items."""
    return [check_spatial_relevance(claim, ev) for ev in evidence_list]


# ============================================================================
# 2. STRUCTURED CONTRADICTION DETECTION
# ============================================================================

def extract_evidence_polarity(evidence: Evidence) -> Optional[str]:
    """Extract explicit structured event stance/polarity from evidence metadata.

    Returns:
    - 'supports' if evidence affirms the event.
    - 'contradicts' if evidence directly refutes the event.
    - None if polarity is unannotated, neutral, or cannot be determined.
    """
    metadata = evidence.metadata or {}

    # 1. Direct polarity field
    pol = metadata.get("polarity") or metadata.get("claim_stance")
    if isinstance(pol, str):
        pol_lower = pol.strip().lower()
        if pol_lower in ("supports", "positive", "affirmative", "confirm", "pro"):
            return "supports"
        if pol_lower in ("contradicts", "negative", "refutes", "denies", "con"):
            return "contradicts"

    # 2. Structured event status field
    status = metadata.get("event_status")
    if isinstance(status, str):
        status_lower = status.strip().lower()
        if status_lower in ("flooding_observed", "event_observed", "present", "active", "confirmed"):
            return "supports"
        if status_lower in ("no_flooding_observed", "event_absent", "absent", "clear", "nominal"):
            return "contradicts"

    # 3. Boolean flag
    for flag_key in ("flood_observed", "event_observed", "inundation_detected"):
        if flag_key in metadata and isinstance(metadata[flag_key], bool):
            return "supports" if metadata[flag_key] else "contradicts"

    # 4. Quantitative sensor reading vs flood threshold
    reading = metadata.get("reading")
    threshold = metadata.get("flood_threshold")
    if isinstance(reading, (int, float)) and isinstance(threshold, (int, float)):
        return "supports" if reading > threshold else "contradicts"

    return None


def check_evidence_contradictions(
    claim: Claim,
    evidence_list: List[Evidence],
    max_time_delta_hours: float = 72.0,
) -> List[Finding]:
    """Detect opposing structured evidence about the same event, location, and time interval.

    Rules:
    - Compares only evidence with explicit opposing structured polarity.
    - Requires matching event context, temporal proximity (<= max_time_delta_hours), and spatial overlap.
    - Unrelated reports or missing fields are NEVER treated as contradictions.
    - Preserves both source IDs and flags for REVIEW without choosing a winner.
    """
    findings: List[Finding] = []
    n = len(evidence_list)

    if n < 2:
        return [
            Finding(
                check_name="contradiction_detection",
                code="NO_CONTRADICTION",
                status=FindingStatus.PASS,
                severity=FindingSeverity.INFO,
                evidence_ids=[ev.evidence_id for ev in evidence_list],
                explanation="Insufficient evidence count to assess pairwise contradictions.",
                details={"conflicts_found": 0, "pairs_evaluated": 0},
            )
        ]

    pairs_evaluated = 0

    for i in range(n):
        for j in range(i + 1, n):
            ev_a = evidence_list[i]
            ev_b = evidence_list[j]
            pairs_evaluated += 1

            pol_a = extract_evidence_polarity(ev_a)
            pol_b = extract_evidence_polarity(ev_b)

            # Rule: Must have explicit opposing polarities
            if not pol_a or not pol_b or pol_a == pol_b:
                continue

            # Rule: Undated opposing evidence cannot be confirmed as same-time conflict.
            # Flag it as a possible contradiction for review instead of silently skipping it.
            if ev_a.acquired_at is None or ev_b.acquired_at is None:
                geom_a, _ = parse_geometry(ev_a.geometry, ev_a.bbox)
                geom_b, _ = parse_geometry(ev_b.geometry, ev_b.bbox)
                if geom_a is not None and geom_b is not None and not geom_a.intersects(geom_b):
                    continue
                findings.append(
                    Finding(
                        check_name="contradiction_detection",
                        code="POSSIBLE_CONTRADICTION",
                        status=FindingStatus.REVIEW,
                        severity=FindingSeverity.MEDIUM,
                        evidence_ids=[ev_a.evidence_id, ev_b.evidence_id],
                        explanation=(
                            f"Evidence '{ev_a.evidence_id}' (reports '{pol_a}') and '{ev_b.evidence_id}' "
                            f"(reports '{pol_b}') disagree, but at least one lacks an acquisition timestamp, "
                            "so it cannot be confirmed they describe the same time. "
                            "Publication date is not used as event date. Both sides preserved."
                        ),
                        details={
                            "evidence_a": {"id": ev_a.evidence_id, "polarity": pol_a},
                            "evidence_b": {"id": ev_b.evidence_id, "polarity": pol_b},
                            "timing_unknown": True,
                            "claim_event_type": claim.event_type,
                        },
                    )
                )
                continue

            time_diff_hours = abs((ev_a.acquired_at - ev_b.acquired_at).total_seconds()) / 3600.0
            if time_diff_hours > max_time_delta_hours:
                continue

            # Rule: Check spatial overlap between the two evidence items (or with the claim)
            geom_a, err_a = parse_geometry(ev_a.geometry, ev_a.bbox)
            geom_b, err_b = parse_geometry(ev_b.geometry, ev_b.bbox)

            if geom_a is not None and geom_b is not None:
                if not geom_a.intersects(geom_b):
                    # Reports are from completely disjoint locations; not a direct contradiction
                    continue

            # Opposing structured evidence detected about the same place, time, and event
            findings.append(
                Finding(
                    check_name="contradiction_detection",
                    code="CONTRADICTION",
                    status=FindingStatus.REVIEW,
                    severity=FindingSeverity.HIGH,
                    evidence_ids=[ev_a.evidence_id, ev_b.evidence_id],
                    explanation=(
                        f"Direct contradiction detected between evidence '{ev_a.evidence_id}' "
                        f"(reports '{pol_a}') and '{ev_b.evidence_id}' (reports '{pol_b}') "
                        f"for event '{claim.event_type}'. Both sources refer to overlapping spatial "
                        f"and times ({format_duration(time_diff_hours)} apart). "
                        "Neither source is arbitrarily favored; flagged for human review."
                    ),
                    details={
                        "evidence_a": {"id": ev_a.evidence_id, "polarity": pol_a, "acquired_at": ev_a.acquired_at.isoformat()},
                        "evidence_b": {"id": ev_b.evidence_id, "polarity": pol_b, "acquired_at": ev_b.acquired_at.isoformat()},
                        "time_diff_hours": round(time_diff_hours, 2),
                        "claim_event_type": claim.event_type,
                    },
                )
            )

    if not findings:
        return [
            Finding(
                check_name="contradiction_detection",
                code="NO_CONTRADICTION",
                status=FindingStatus.PASS,
                severity=FindingSeverity.INFO,
                evidence_ids=[ev.evidence_id for ev in evidence_list],
                explanation="No structured contradictions detected among the evaluated evidence items.",
                details={"conflicts_found": 0, "pairs_evaluated": pairs_evaluated},
            )
        ]

    return findings


# ============================================================================
# 3. PROMPT-INJECTION SAFETY CHECKS
# ============================================================================

def check_prompt_injection(evidence: Evidence) -> Finding:
    """Detect suspicious instruction-like patterns in untrusted evidence text.

    Principles:
    - All evidence content is treated as untrusted data, never as executable instructions.
    - Returns WARN when suspicious patterns are found.
    - Heuristic detection is a supplementary filter and does NOT guarantee immunity from injection.
    - Kept completely separate from the final verdict policy.
    """
    evidence_id = evidence.evidence_id
    text_corpus = evidence.content or ""

    # Also inspect string fields in metadata
    if evidence.metadata:
        for k, v in evidence.metadata.items():
            if isinstance(v, str):
                text_corpus += f" {v}"

    detected_patterns: List[str] = []
    matched_snippets: List[str] = []

    for name, pattern in INJECTION_PATTERNS:
        match = re.search(pattern, text_corpus)
        if match:
            detected_patterns.append(name)
            # Capture short excerpt around the match
            start = max(0, match.start() - 15)
            end = min(len(text_corpus), match.end() + 15)
            matched_snippets.append(text_corpus[start:end].strip())

    if detected_patterns:
        return Finding(
            check_name="prompt_injection_safety",
            code="INJECTION_SUSPECTED",
            status=FindingStatus.WARN,
            severity=FindingSeverity.HIGH,
            evidence_ids=[evidence_id],
            explanation=(
                f"Suspicious instruction-like pattern(s) detected in evidence '{evidence_id}': "
                f"{', '.join(detected_patterns)}. Evidence content must be treated strictly "
                "as untrusted passive data and never executed. "
                "Notice: Heuristic keyword pattern detection is a supplementary hygiene filter "
                "and does not guarantee complete prompt-injection defense."
            ),
            details={
                "detected_patterns": detected_patterns,
                "matched_snippets": matched_snippets,
                "defense_guarantee": "Heuristic detection does not guarantee complete protection.",
            },
        )

    return Finding(
        check_name="prompt_injection_safety",
        code="NO_INJECTION_DETECTED",
        status=FindingStatus.PASS,
        severity=FindingSeverity.INFO,
        evidence_ids=[evidence_id],
        explanation=(
            f"No suspicious instruction-like patterns detected in evidence '{evidence_id}'. "
            "Evidence content treated as untrusted passive data."
        ),
        details={"patterns_checked": len(INJECTION_PATTERNS), "suspicious_patterns_found": 0},
    )


def run_injection_checks(evidence_list: List[Evidence]) -> List[Finding]:
    """Execute prompt-injection safety checks across all provided evidence items."""
    return [check_prompt_injection(ev) for ev in evidence_list]


# ============================================================================
# 4. TEMPORAL & METADATA CHECKS (Preserved from Milestone 1)
# ============================================================================

def check_temporal_relevance(
    claim: Claim,
    evidence: Evidence,
    freshness_hours: Optional[float] = None,
) -> Finding:
    """Evaluate whether evidence observation date is temporally relevant to the claim window.

    Rules:
    - Distinguishes acquisition timestamp (acquired_at) from publication timestamp (published_at).
    - Missing acquired_at is flagged as a temporal deficiency (WARN or FAIL).
    - If acquired_at falls strictly within [claim_start, claim_end], status is PASS.
    - If outside interval, calculates the gap in hours and compares to freshness_hours threshold.
    """
    threshold = (
        freshness_hours
        if freshness_hours is not None
        else FRESHNESS_HOURS_BY_EVENT.get(claim.event_type.strip().lower(), DEFAULT_FRESHNESS_HOURS)
    )
    evidence_id = evidence.evidence_id

    # Case 1: acquired_at is absent
    if evidence.acquired_at is None:
        if evidence.published_at is not None:
            return Finding(
                check_name="temporal_relevance",
                code="PUBLICATION_DATE_ONLY",
                status=FindingStatus.WARN,
                severity=FindingSeverity.MEDIUM,
                evidence_ids=[evidence_id],
                explanation=(
                    f"Evidence '{evidence_id}' has no observation date, only a publication date "
                    f"({format_moment(evidence.published_at)}). A report published on a date may describe "
                    "an event from an earlier day, so the publication date is not used as the event date."
                ),
                details={
                    "missing_field": "acquired_at",
                    "has_published_at": True,
                    "published_at": evidence.published_at.isoformat(),
                },
            )
        return Finding(
            check_name="temporal_relevance",
            code="TEMPORAL_UNKNOWN",
            status=FindingStatus.FAIL,
            severity=FindingSeverity.HIGH,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' has no observation date and no publication date, "
                "so there is no way to tell whether it describes the claimed date."
            ),
            details={"missing_field": "acquired_at", "has_published_at": False},
        )

    # Case 2: acquired_at is present. Compare to claim window [claim_start, claim_end]
    acq = evidence.acquired_at

    # Exact window hit
    if claim.claim_start <= acq <= claim.claim_end:
        return Finding(
            check_name="temporal_relevance",
            code="TEMPORAL_MATCH",
            status=FindingStatus.PASS,
            severity=FindingSeverity.INFO,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' was observed on {format_moment(acq)}, "
                f"within the claimed date ({format_window(claim.claim_start, claim.claim_end)})."
            ),
            details={
                "temporal_gap_hours": 0.0,
                "is_within_window": True,
                "acquired_at": acq.isoformat(),
            },
        )

    # Outside window: calculate temporal gap
    if acq < claim.claim_start:
        gap_seconds = (claim.claim_start - acq).total_seconds()
        direction = "before claim_start"
    else:
        gap_seconds = (acq - claim.claim_end).total_seconds()
        direction = "after claim_end"

    gap_hours = gap_seconds / 3600.0
    when = "before" if direction == "before claim_start" else "after"
    claimed = format_window(claim.claim_start, claim.claim_end)

    if gap_hours <= threshold:
        return Finding(
            check_name="temporal_relevance",
            code="NEAR_INTERVAL",
            status=FindingStatus.WARN,
            severity=FindingSeverity.LOW,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' was observed {format_duration(gap_hours)} {when} the claimed date "
                f"({claimed}), on {format_moment(acq)}. That is within the "
                f"{format_duration(threshold)} limit for {claim.event_type}, so it still counts."
            ),
            details={
                "temporal_gap_hours": round(gap_hours, 2),
                "direction": direction,
                "freshness_threshold_hours": threshold,
                "is_within_window": False,
                "is_within_freshness_threshold": True,
            },
        )

    # Beyond freshness threshold
    return Finding(
        check_name="temporal_relevance",
        code="STALE_EVIDENCE",
        status=FindingStatus.FAIL,
        severity=FindingSeverity.HIGH,
        evidence_ids=[evidence_id],
        explanation=(
            f"Evidence '{evidence_id}' was observed on {format_moment(acq)}, "
            f"{format_duration(gap_hours)} {when} the claimed date ({claimed}). "
            f"The limit for {claim.event_type} is {format_duration(threshold)}, so it is too old "
            "to show conditions on the claimed date."
        ),
        details={
            "temporal_gap_hours": round(gap_hours, 2),
            "direction": direction,
            "freshness_threshold_hours": threshold,
            "is_within_window": False,
            "is_within_freshness_threshold": False,
        },
    )


def check_metadata_completeness(
    evidence: Evidence,
    required_metadata: Optional[Dict[str, List[str]]] = None,
) -> Finding:
    """Verify that evidence contains necessary metadata attributes according to its source type.

    Rules:
    - Missing metadata reports the specific missing keys.
    - Treats missing/unknown metadata as unknown rather than proof of claim falsity.
    - Checks provenance presence.
    """
    req_map = required_metadata if required_metadata is not None else DEFAULT_REQUIRED_METADATA
    evidence_id = evidence.evidence_id
    source_type = evidence.source_type

    if source_type not in req_map:
        return Finding(
            check_name="metadata_completeness",
            code="UNKNOWN_SOURCE_TYPE",
            status=FindingStatus.WARN,
            severity=FindingSeverity.MEDIUM,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' has source type '{source_type}', which has no metadata "
                "requirements defined. Completeness is unknown, not proof that the claim is false."
            ),
            details={"source_type": source_type, "known_source_types": sorted(req_map)},
        )

    expected_keys = req_map[source_type]
    actual_metadata = evidence.metadata or {}

    missing_keys: List[str] = []
    empty_keys: List[str] = []

    for key in expected_keys:
        if key not in actual_metadata:
            missing_keys.append(key)
        elif actual_metadata[key] is None or actual_metadata[key] == "":
            empty_keys.append(key)

    missing_provenance = not bool(evidence.provenance)

    if not missing_keys and not empty_keys and not missing_provenance:
        return Finding(
            check_name="metadata_completeness",
            code="METADATA_OK",
            status=FindingStatus.PASS,
            severity=FindingSeverity.INFO,
            evidence_ids=[evidence_id],
            explanation=(
                f"Evidence '{evidence_id}' of type '{source_type}' contains all required "
                f"metadata fields ({', '.join(expected_keys) if expected_keys else 'none specified'}) "
                "and valid provenance."
            ),
            details={
                "source_type": source_type,
                "verified_fields": expected_keys,
                "has_provenance": True,
            },
        )

    all_deficiencies = []
    if missing_keys:
        all_deficiencies.append(f"missing fields: {', '.join(missing_keys)}")
    if empty_keys:
        all_deficiencies.append(f"empty fields: {', '.join(empty_keys)}")
    if missing_provenance:
        all_deficiencies.append("missing provenance documentation")

    severity = FindingSeverity.MEDIUM if missing_keys or missing_provenance else FindingSeverity.LOW

    return Finding(
        check_name="metadata_completeness",
        code="MISSING_METADATA",
        status=FindingStatus.WARN,
        severity=severity,
        evidence_ids=[evidence_id],
        explanation=(
            f"Evidence '{evidence_id}' of type '{source_type}' has incomplete metadata: "
            + "; ".join(all_deficiencies)
            + ". Missing metadata reflects source quality uncertainty, not proof that the claim is false."
        ),
        details={
            "source_type": source_type,
            "missing_fields": missing_keys,
            "empty_fields": empty_keys,
            "missing_provenance": missing_provenance,
        },
    )


def run_temporal_checks(
    claim: Claim,
    evidence_list: List[Evidence],
    freshness_hours: Optional[float] = None,
) -> List[Finding]:
    """Execute temporal check across all provided evidence items."""
    return [check_temporal_relevance(claim, ev, freshness_hours) for ev in evidence_list]


def run_metadata_checks(
    evidence_list: List[Evidence],
    required_metadata: Optional[Dict[str, List[str]]] = None,
) -> List[Finding]:
    """Execute metadata completeness check across all provided evidence items."""
    return [check_metadata_completeness(ev, required_metadata) for ev in evidence_list]
