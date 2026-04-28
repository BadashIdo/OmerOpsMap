"""OpenMeteoClient: schema mapping, RTL labels, single-point query."""

import json

import httpx
import pytest
import respx

from app.services.integrations.openmeteo_client import API_URL, OpenMeteoClient

pytestmark = pytest.mark.asyncio


@respx.mock
async def test_emits_one_feature_with_hebrew_label(fixtures_dir):
    payload = json.loads((fixtures_dir / "openmeteo_response.json").read_text(encoding="utf-8"))
    respx.get(API_URL).mock(return_value=httpx.Response(200, json=payload))

    client = OpenMeteoClient()
    rows = await client.fetch()

    assert len(rows) == 1
    row = rows[0]
    assert row.kind == "current"
    assert row.external_id is None
    assert row.lat == pytest.approx(31.2632)
    assert row.lng == pytest.approx(34.8419)
    # weather_code 2 maps to "מעונן חלקית"
    assert "מעונן חלקית" in row.name
    assert "27.4" in row.name
    assert row.payload["temperature_2m"] == 27.4
    assert row.payload["weather_label_he"] == "מעונן חלקית"


@respx.mock
async def test_returns_empty_when_current_block_missing():
    respx.get(API_URL).mock(return_value=httpx.Response(200, json={"latitude": 31.2}))
    client = OpenMeteoClient()
    rows = await client.fetch()
    assert rows == []


@respx.mock
async def test_unknown_weather_code_falls_back_safely():
    respx.get(API_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "current": {
                    "time": "2026-04-28T15:00",
                    "temperature_2m": 25,
                    "wind_speed_10m": 10,
                    "relative_humidity_2m": 50,
                    "weather_code": 99999,  # not in WMO map
                    "precipitation": 0,
                }
            },
        )
    )
    client = OpenMeteoClient()
    rows = await client.fetch()
    assert len(rows) == 1
    assert rows[0].payload["weather_label_he"] == "לא ידוע"
