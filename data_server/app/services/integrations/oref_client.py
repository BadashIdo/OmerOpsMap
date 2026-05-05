"""Pikud Haoref (Home Front Command) alert client.

Polls the public alerts JSON. When the response includes a polygon name
matching one of `OMER_POLYGON_NAMES`, emits one feature at Omer center.

Docs: no formal docs. Endpoint behavior:
  - Empty body or `""` when no active alert
  - JSON object `{"id":..., "title":..., "data":["שם אזור", ...], "cat":"1"}` while alert active
  - `cat` codes (rocket=1, drone=13, infiltration=4, etc.) determine `kind`

Pre-flight: confirm `OMER_POLYGON_NAMES` against
https://www.oref.org.il/WarningMessages/History/AlertsHistory.json before shipping.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Iterable, List, Optional
from pathlib import Path
import json

import httpx

from app.config import get_settings
from app.services.integrations.base import IntegrationClient, NormalizedFeature
from app.services.integrations.geofence import OMER_CENTER

logger = logging.getLogger(__name__)

ALERT_URL = "https://www.oref.org.il/WarningMessages/alert/alerts.json"
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; OmerOpsMap/1.0)",
    "Referer": "https://www.oref.org.il/",
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/plain, */*",
}

# Pre-flight: validated against AlertsHistory.json. Update if oref redraws zones.
OMER_POLYGON_NAMES = {"עומר"}

# Alert category code → (kind, severity 0-3, Hebrew label)
CATEGORY_MAP = {
    "1": ("rocket", 3, "ירי טילים ורקטות"),
    "2": ("hostile_aircraft", 3, "חדירת כלי טיס עוין"),
    "3": ("earthquake", 2, "רעידת אדמה"),
    "4": ("infiltration", 3, "חדירת מחבלים"),
    "5": ("hazardous_materials", 2, "אירוע חומ\"ס"),
    "6": ("non_conventional", 3, "אירוע לא קונבנציונלי"),
    "7": ("missile_from_sea", 3, "ירי מהים"),
    "13": ("hostile_aircraft", 3, "חדירת כלי טיס עוין"),
    "14": ("tsunami", 2, "חשש לצונאמי"),
    "15": ("infiltration", 3, "חדירת מחבלים"),
}


class OrefClient(IntegrationClient):
    name = "oref_alert"
    # Default cadence; the scheduler may switch to active mode after a hit.
    cadence_seconds = 30
    # Anti-flicker: keep rows non-stale for 90 s after last sighting.
    stale_ttl_seconds = 90
    purge_hours = 24

    def __init__(self) -> None:
        self.settings = get_settings()

    async def fetch(self) -> List[NormalizedFeature]:
        raw = await self._fetch_raw()
        if not raw:
            return []

        polygons = self._extract_polygons(raw)
        if not polygons:
            return []

        if not (polygons & OMER_POLYGON_NAMES):
            return []

        cat = str(raw.get("cat") or "1")
        kind, severity, label = CATEGORY_MAP.get(cat, ("alert", 3, "התרעה"))

        title = raw.get("title") or label
        alert_id = str(raw.get("id") or f"oref-{datetime.now(timezone.utc).isoformat()}")
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        return [
            NormalizedFeature(
                external_id=alert_id,
                kind=kind,
                name=f"{title} — עומר",
                description=raw.get("desc"),
                lat=OMER_CENTER[0],
                lng=OMER_CENTER[1],
                severity=severity,
                expires_at=expires_at,
                payload={
                    "alert_id": alert_id,
                    "title": title,
                    "cat": cat,
                    "label_he": label,
                    "polygons": list(polygons),
                    "raw": raw,
                },
            )
        ]

    async def _fetch_raw(self) -> Optional[dict]:
        if self.settings.oref_stub_path:
            path = Path(self.settings.oref_stub_path)
            if not path.exists():
                logger.warning("oref stub path not found: %s", path)
                return None
            content = path.read_text(encoding="utf-8").strip()
            if not content:
                return None
            return json.loads(content)

        async with httpx.AsyncClient(timeout=10.0, headers=DEFAULT_HEADERS) as http:
            response = await http.get(ALERT_URL)
            response.raise_for_status()
            text = response.text.strip()
        if not text:
            return None
        # Remove possible UTF-8 BOM that the endpoint occasionally returns.
        if text.startswith("﻿"):
            text = text[1:]
        if not text:
            return None
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("oref returned non-JSON body: %r", text[:120])
            return None

    @staticmethod
    def _extract_polygons(raw: dict) -> set:
        data = raw.get("data") or []
        if isinstance(data, str):
            data = [data]
        return {str(name).strip() for name in data if name}
