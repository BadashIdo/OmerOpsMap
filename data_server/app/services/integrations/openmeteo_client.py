"""Open-Meteo current-weather client.

Free, no API key. Single-point query at Omer center returns one synthetic
feature each cycle. The row is keyed by `(source=openmeteo_weather, kind='current')`
without an `external_id`; the repo upserts it by spatial key.

Docs: https://open-meteo.com/en/docs
"""

import logging
from typing import List

import httpx

from app.services.integrations.base import IntegrationClient, NormalizedFeature
from app.services.integrations.geofence import OMER_CENTER

logger = logging.getLogger(__name__)

API_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather code → short Hebrew label. Source: open-meteo.com/en/docs
WEATHER_CODE_LABELS = {
    0: "בהיר",
    1: "בהיר חלקית",
    2: "מעונן חלקית",
    3: "מעונן",
    45: "ערפל",
    48: "ערפל מעובה",
    51: "טפטוף קל",
    53: "טפטוף",
    55: "טפטוף חזק",
    61: "גשם קל",
    63: "גשם",
    65: "גשם חזק",
    71: "שלג קל",
    73: "שלג",
    75: "שלג חזק",
    80: "ממטרים",
    81: "ממטרים חזקים",
    82: "ממטרים עזים",
    95: "סופת רעמים",
    96: "סופת רעמים עם ברד",
    99: "סופת רעמים עזה",
}


class OpenMeteoClient(IntegrationClient):
    name = "openmeteo_weather"
    cadence_seconds = 15 * 60  # 15 min — model output cadence
    purge_hours = 6
    stale_ttl_seconds = 60 * 60  # 1 hour grace before marking stale

    async def fetch(self) -> List[NormalizedFeature]:
        params = {
            "latitude": OMER_CENTER[0],
            "longitude": OMER_CENTER[1],
            "current": "temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code,precipitation",
            "timezone": "auto",
        }
        async with httpx.AsyncClient(timeout=15.0) as http:
            response = await http.get(API_URL, params=params)
            response.raise_for_status()
            data = response.json()

        current = data.get("current") or {}
        if not current:
            return []

        temp = current.get("temperature_2m")
        wind = current.get("wind_speed_10m")
        rh = current.get("relative_humidity_2m")
        code = current.get("weather_code")
        precip = current.get("precipitation")

        label = WEATHER_CODE_LABELS.get(code, "לא ידוע")
        name = f"{label} · {temp}°C" if temp is not None else label
        description_parts = []
        if temp is not None:
            description_parts.append(f"טמפרטורה: {temp}°C")
        if rh is not None:
            description_parts.append(f"לחות: {rh}%")
        if wind is not None:
            description_parts.append(f"רוח: {wind} קמ\"ש")
        if precip is not None and precip > 0:
            description_parts.append(f"משקעים: {precip} מ\"מ")

        return [
            NormalizedFeature(
                external_id=None,  # Synthetic — repo matches by (source, kind, lat, lng)
                kind="current",
                name=name,
                description=" · ".join(description_parts) if description_parts else None,
                lat=OMER_CENTER[0],
                lng=OMER_CENTER[1],
                severity=None,
                payload={
                    "temperature_2m": temp,
                    "wind_speed_10m": wind,
                    "relative_humidity_2m": rh,
                    "weather_code": code,
                    "weather_label_he": label,
                    "precipitation": precip,
                    "time": current.get("time"),
                },
            )
        ]
