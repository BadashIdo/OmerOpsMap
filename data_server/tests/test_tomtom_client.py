"""TomTomClient: incident schema mapping, geometry handling, missing-key gating."""

import json

import httpx
import pytest
import respx

from app.services.integrations.tomtom_client import (
    INCIDENT_DETAILS_URL,
    TomTomClient,
)

pytestmark = pytest.mark.asyncio


def _client_with_key(monkeypatch) -> TomTomClient:
    monkeypatch.setenv("TOMTOM_API_KEY", "test-key")
    from app.config import get_settings
    get_settings.cache_clear()
    return TomTomClient()


async def test_disabled_when_no_key(monkeypatch):
    monkeypatch.delenv("TOMTOM_API_KEY", raising=False)
    from app.config import get_settings
    get_settings.cache_clear()

    client = TomTomClient()
    assert client.is_disabled() is True
    rows = await client.fetch()
    assert rows == []


@respx.mock
async def test_normalizes_linestring_and_point_incidents(fixtures_dir, monkeypatch):
    payload = json.loads(
        (fixtures_dir / "tomtom_incident_details.json").read_text(encoding="utf-8")
    )
    respx.get(INCIDENT_DETAILS_URL).mock(return_value=httpx.Response(200, json=payload))

    client = _client_with_key(monkeypatch)
    rows = await client.fetch()

    # All 3 fixture incidents have ids and valid geometries — all normalized.
    assert len(rows) == 3

    by_id = {r.external_id: r for r in rows}
    accident = by_id["tomtom-12345"]
    assert accident.kind == "accident"
    assert accident.severity == 2
    assert accident.lat == pytest.approx(31.271, rel=1e-3)  # midpoint of LineString
    # description from events[0]
    assert "תאונה" in accident.name

    works = by_id["tomtom-67890"]
    assert works.kind == "road_works"
    assert works.lat == pytest.approx(31.265)
    assert works.lng == pytest.approx(34.85)

    # Far one would still be normalized — geofence filter happens in orchestrator.
    far = by_id["tomtom-99999"]
    assert far.lat == pytest.approx(31.30)


@respx.mock
async def test_unknown_icon_category_maps_to_other(monkeypatch):
    respx.get(INCIDENT_DETAILS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "incidents": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [34.84, 31.27]},
                        "properties": {
                            "id": "weird-1",
                            "iconCategory": 99,  # not in our map
                            "magnitudeOfDelay": 1,
                            "events": [],
                        },
                    }
                ]
            },
        )
    )
    client = _client_with_key(monkeypatch)
    rows = await client.fetch()
    assert len(rows) == 1
    assert rows[0].kind == "other"


@respx.mock
async def test_skips_incidents_without_id(monkeypatch):
    respx.get(INCIDENT_DETAILS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "incidents": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [34.84, 31.27]},
                        "properties": {"iconCategory": 1},
                    }
                ]
            },
        )
    )
    client = _client_with_key(monkeypatch)
    rows = await client.fetch()
    assert rows == []


@respx.mock
async def test_skips_incidents_without_geometry(monkeypatch):
    respx.get(INCIDENT_DETAILS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "incidents": [
                    {
                        "type": "Feature",
                        "geometry": {},
                        "properties": {"id": "no-geom", "iconCategory": 1},
                    }
                ]
            },
        )
    )
    client = _client_with_key(monkeypatch)
    rows = await client.fetch()
    assert rows == []
