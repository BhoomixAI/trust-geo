"""Data models for TRUST-GEO verification and audit pipelines."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class Verdict(str, Enum):
    """Allowed final verdicts for verification results."""
    SUPPORTED = "SUPPORTED"
    REFUTED = "REFUTED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NEEDS_REVIEW = "NEEDS_REVIEW"


# Backwards-compatible alias for earlier code.
VerdictEnum = Verdict

WorkflowMode = Literal["baseline", "protected"]


class FindingStatus(str, Enum):
    """Status outcomes for individual deterministic checks."""
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    REVIEW = "REVIEW"


class FindingSeverity(str, Enum):
    """Severity ratings for verification findings."""
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


def _ensure_timezone_aware(dt: Optional[datetime], field_name: str) -> Optional[datetime]:
    """Validate that a datetime is timezone-aware."""
    if dt is not None and dt.tzinfo is None:
        raise ValueError(
            f"Field '{field_name}' must be a timezone-aware ISO 8601 datetime (e.g., ending with 'Z' or '+00:00')."
        )
    return dt


class Claim(BaseModel):
    """A geospatial claim subjected to verification against evidence."""
    case_id: str = Field(..., min_length=1, description="Unique case identifier")
    claim_text: str = Field(..., min_length=3, description="Natural language statement of the claim")
    event_type: str = Field(..., min_length=1, description="Event classification (e.g., flooding, landslide, fire)")
    area_of_interest: Dict[str, Any] = Field(
        ..., description="GeoJSON geometry or bounding representation of the claimed location"
    )
    claim_start: datetime = Field(..., description="Start of the claimed event interval (timezone-aware)")
    claim_end: datetime = Field(..., description="End of the claimed event interval (timezone-aware)")

    @field_validator("claim_start", "claim_end")
    @classmethod
    def validate_tz(cls, v: datetime, info) -> datetime:
        res = _ensure_timezone_aware(v, info.field_name)
        assert res is not None
        return res

    @model_validator(mode="after")
    def validate_interval(self) -> Claim:
        if self.claim_start > self.claim_end:
            raise ValueError(
                f"claim_start ({self.claim_start.isoformat()}) cannot be after claim_end ({self.claim_end.isoformat()})."
            )
        return self


class Evidence(BaseModel):
    """An atomic piece of evidence (satellite metadata, news report, sensor reading, etc.)."""
    evidence_id: str = Field(..., min_length=1, description="Unique evidence identifier")
    source_type: str = Field(..., min_length=1, description="Type of source (satellite, news_report, sensor, field_report)")
    source_id: str = Field(..., min_length=1, description="Primary external source ID or scene ID")
    source_url: Optional[str] = Field(default=None, description="Source locator URL if available")
    acquired_at: Optional[datetime] = Field(
        default=None,
        description="Physical acquisition / observation timestamp (timezone-aware). Distinct from published_at."
    )
    published_at: Optional[datetime] = Field(
        default=None,
        description="Publication / dissemination timestamp (timezone-aware). Must not be conflated with acquired_at."
    )
    geometry: Optional[Dict[str, Any]] = Field(
        default=None,
        description="GeoJSON geometry representing spatial footprint of the evidence"
    )
    bbox: Optional[List[float]] = Field(
        default=None,
        description="Bounding box [min_lon, min_lat, max_lon, max_lat] if applicable"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Source-specific metadata key-value attributes"
    )
    content: str = Field(
        default="",
        description="Text content, summary, or extracted metadata description"
    )
    provenance: Dict[str, Any] = Field(
        default_factory=dict,
        description="Traceability details (provider, pipeline version, retrieval timestamp)"
    )
    is_synthetic: bool = Field(
        default=True,
        description="Whether this evidence record is synthetic demonstration data"
    )

    @field_validator("acquired_at", "published_at")
    @classmethod
    def validate_tz(cls, v: Optional[datetime], info) -> Optional[datetime]:
        return _ensure_timezone_aware(v, info.field_name)


class Finding(BaseModel):
    """Outcome of an individual deterministic verification check."""
    check_name: str = Field(..., min_length=1, description="Name of the deterministic check")
    code: str = Field(
        default="UNSPECIFIED",
        min_length=1,
        description="Machine-readable outcome code (e.g., TEMPORAL_MATCH, STALE_EVIDENCE, WRONG_LOCATION)",
    )
    status: FindingStatus = Field(..., description="Check status: PASS, WARN, FAIL, or REVIEW")
    severity: FindingSeverity = Field(..., description="Severity level of the finding")
    evidence_ids: List[str] = Field(default_factory=list, description="IDs of evidence evaluated in this check")
    explanation: str = Field(..., min_length=1, description="Human-readable explanation of the finding")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured diagnostics and metric values")


class BenchmarkCase(BaseModel):
    """A labelled benchmark case: a claim, the IDs of its evidence bundle, and a frozen expected verdict."""
    case_id: str = Field(..., min_length=1, description="Unique case identifier (e.g., C01)")
    scenario: str = Field(..., min_length=1, description="Short description of the scenario being tested")
    scenario_tags: List[str] = Field(default_factory=list, description="Tags describing the failure mode tested")
    claim: Claim = Field(..., description="The claim under test")
    evidence_ids: List[str] = Field(default_factory=list, description="IDs of evidence items in this case's bundle")
    expected_verdict: Verdict = Field(..., description="Frozen expected verdict label")
    reason: str = Field(..., min_length=1, description="One-line rationale for the expected verdict")
    is_synthetic: bool = Field(default=True, description="Whether this case is synthetic demonstration data")

    @model_validator(mode="after")
    def validate_case_id_matches_claim(self) -> BenchmarkCase:
        if self.claim.case_id != self.case_id:
            raise ValueError(
                f"case_id '{self.case_id}' does not match claim.case_id '{self.claim.case_id}'."
            )
        return self


class RunResult(BaseModel):
    """Auditable result of running a verification workflow on a claim."""
    run_id: str = Field(..., min_length=1, description="Unique identifier for this verification run")
    case_id: str = Field(..., min_length=1, description="Identifier of the claim being verified")
    mode: WorkflowMode = Field(..., description="Workflow mode: 'baseline' or 'protected'")
    verdict: Verdict = Field(..., description="Final verification verdict")
    findings: List[Finding] = Field(default_factory=list, description="List of findings from deterministic checks")
    evidence_ids: List[str] = Field(default_factory=list, description="List of all evidence IDs considered")
    next_evidence_needed: List[str] = Field(
        default_factory=list,
        description="Concrete evidence that would resolve remaining uncertainty",
    )
    elapsed_ms: float = Field(default=0.0, ge=0.0, description="Workflow execution time in milliseconds")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when verification completed (timezone-aware)"
    )
    synthetic_demo: bool = Field(default=True, description="Flag indicating synthetic demonstration run")
    explanation: Optional[str] = Field(default=None, description="Summary rationale for the final verdict")
    uncertainties: List[str] = Field(default_factory=list, description="Explicitly documented uncertainties")

    @field_validator("timestamp")
    @classmethod
    def validate_tz(cls, v: datetime, info) -> datetime:
        res = _ensure_timezone_aware(v, info.field_name)
        assert res is not None
        return res
