"""OrefClient: polygon-name match, dynamic categories, stub fallback."""

import pytest

from app.services.integrations.oref_client import OrefClient

pytestmark = pytest.mark.asyncio


async def test_active_alert_for_omer_emits_feature(fixtures_dir, monkeypatch):
    monkeypatch.setenv("OREF_STUB_PATH", str(fixtures_dir / "oref_alert_active.json"))
    # Settings is cached via lru_cache; reset so the new env var is picked up.
    from app.config import get_settings
    get_settings.cache_clear()

    client = OrefClient()
    rows = await client.fetch()

    assert len(rows) == 1
    row = rows[0]
    assert row.kind == "rocket"
    assert row.severity == 3
    assert "עומר" in row.name
    assert row.external_id == "133417823930000000"
    assert "עומר" in row.payload["polygons"]


async def test_alert_without_omer_emits_nothing(fixtures_dir, monkeypatch):
    monkeypatch.setenv("OREF_STUB_PATH", str(fixtures_dir / "oref_alert_no_omer.json"))
    from app.config import get_settings
    get_settings.cache_clear()

    client = OrefClient()
    rows = await client.fetch()

    assert rows == []


async def test_empty_response_emits_nothing(fixtures_dir, monkeypatch):
    monkeypatch.setenv("OREF_STUB_PATH", str(fixtures_dir / "oref_alert_clear.json"))
    from app.config import get_settings
    get_settings.cache_clear()

    client = OrefClient()
    rows = await client.fetch()

    assert rows == []


async def test_unknown_category_falls_back(fixtures_dir, tmp_path, monkeypatch):
    payload = (
        '{"id":"x","cat":"999","title":"חדש","data":["עומר"]}'
    )
    stub_file = tmp_path / "oref_unknown_cat.json"
    stub_file.write_text(payload, encoding="utf-8")
    monkeypatch.setenv("OREF_STUB_PATH", str(stub_file))
    from app.config import get_settings
    get_settings.cache_clear()

    client = OrefClient()
    rows = await client.fetch()

    assert len(rows) == 1
    assert rows[0].kind == "alert"
    assert rows[0].severity == 3
