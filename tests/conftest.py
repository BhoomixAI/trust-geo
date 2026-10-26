"""Shared test setup: every test uses a throwaway audit database."""

import pytest

from backend import api


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    db = tmp_path / "audit.db"
    monkeypatch.setattr(api, "DB_PATH", db)
    return db
