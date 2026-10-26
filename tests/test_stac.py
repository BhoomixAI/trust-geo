"""Tests for nearest-acquisition lookup. No network: the live search is replaced by fakes."""

import pytest

from backend.evidence_loader import AcquisitionLookupError, nearest_acquisitions

BBOX = [77.15, 28.55, 77.25, 28.65]

ITEMS = [
    {"item_id": "A", "acquired_at": "2026-10-12T05:41:00Z"},
    {"item_id": "B", "acquired_at": "2026-10-17T05:41:00Z"},
    {"item_id": "C", "acquired_at": "2026-10-22T05:41:00Z"},
    {"item_id": "D", "acquired_at": "2026-10-27T05:41:00Z"},
    {"item_id": "no-time", "acquired_at": None},
]


def fake_search(items):
    return lambda bbox, dt, collection: items


def failing_search(bbox, dt, collection):
    raise TimeoutError("network down")


def test_live_picks_nearest_before_and_after(tmp_path):
    r = nearest_acquisitions(BBOX, "2026-10-20", search_fn=fake_search(ITEMS), cache_path=tmp_path / "c.json")
    assert r["source"] == "live"
    assert r["before"]["item_id"] == "B" and r["before"]["gap_days"] == 3
    assert r["after"]["item_id"] == "C" and r["after"]["gap_days"] == 2
    assert r["items_found"] == 5


def test_same_day_pass_counts_as_before_with_zero_gap(tmp_path):
    items = [{"item_id": "same", "acquired_at": "2026-10-20T23:00:00Z"}]
    r = nearest_acquisitions(BBOX, "2026-10-20", search_fn=fake_search(items), cache_path=tmp_path / "c.json")
    assert r["before"]["gap_days"] == 0
    assert r["after"] is None


def test_falls_back_to_cache_when_live_fails(tmp_path):
    cache = tmp_path / "c.json"
    nearest_acquisitions(BBOX, "2026-10-20", search_fn=fake_search(ITEMS), cache_path=cache)
    r = nearest_acquisitions(BBOX, "2026-10-20", search_fn=failing_search, cache_path=cache)
    assert r["source"] == "cached"
    assert r["before"]["item_id"] == "B"
    assert "network down" in r["live_error"]


def test_unavailable_when_no_live_and_no_cache(tmp_path):
    r = nearest_acquisitions(BBOX, "2026-10-20", search_fn=failing_search, cache_path=tmp_path / "c.json")
    assert r["source"] == "unavailable"
    assert r["before"] is None and r["after"] is None


def test_empty_results_are_honest(tmp_path):
    r = nearest_acquisitions(BBOX, "2026-10-20", search_fn=fake_search([]), cache_path=tmp_path / "c.json")
    assert r["source"] == "live" and r["items_found"] == 0
    assert r["before"] is None and r["after"] is None


@pytest.mark.parametrize("bbox", [[1, 2, 3], [10, 0, 5, 1], [0, 0, 200, 1], ["a", 0, 1, 1]])
def test_bad_bbox_rejected(bbox, tmp_path):
    with pytest.raises(AcquisitionLookupError):
        nearest_acquisitions(bbox, "2026-10-20", search_fn=fake_search([]), cache_path=tmp_path / "c.json")


def test_bad_date_rejected(tmp_path):
    with pytest.raises(AcquisitionLookupError):
        nearest_acquisitions(BBOX, "20 Oct", search_fn=fake_search([]), cache_path=tmp_path / "c.json")


def test_shipped_cache_covers_demo_area():
    """The committed cache lets the demo work offline for the benchmark AOI and date."""
    r = nearest_acquisitions(BBOX, "2026-10-20", search_fn=failing_search)
    assert r["source"] == "cached"
    assert r["before"] is not None
