"""Evidence and claim loader module with comprehensive validation and descriptive error reporting."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Union
from pydantic import ValidationError

from backend.schemas import Claim, Evidence


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
