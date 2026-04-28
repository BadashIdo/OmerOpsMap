"""TomTom Traffic Incident Details client.

Returns highway-grade incidents (accidents, road works, jams, closures)
within the Omer bounding box. Inside-town probe density is low; this layer
covers Routes 60/25 and other access roads, not intra-town events.

Self-disables when `TOMTOM_API_KEY` is missing.

ToS: cached data must not be redistributed beyond the licensed app context;
hard-delete at the 24 h purge boundary (do NOT extend `purge_hours`).

Docs: https://developer.tomtom.com/traffic-api/documentation/traffic-incidents/incident-details
"""

import logging
from typing import List, Optional

import httpx

from app.config import get_settings
from app.services.integrations.base import IntegrationClient, NormalizedFeature
from app.services.integrations.geofence import omer_bbox

logger = logging.getLogger(__name__)

INCIDENT_DETAILS_URL = "https://api.tomtom.com/traffic/services/5/incidentDetails"

# TomTom iconCategory → (kind, severity 0-3, Hebrew label)
ICON_CATEGORY_MAP = {
    0: ("unknown", 1, "אירוע לא ידוע"),
    1: ("accident", 3, "תאונה"),
    2: ("fog", 1, "ערפל"),
    3: ("dangerous_conditions", 2, "תנאי דרך מסוכנים"),
    4: ("rain", 1, "גשם"),
    5: ("ice", 2, "כביש מאובק"),
    6: ("jam", 2, "פקק"),
    7: ("lane_closed", 2, "סגירת נתיב"),
    8: ("road_closed", 3, "כביש סגור"),
    9: ("road_works", 1, "עבודות בכביש"),
    10: ("wind", 1, "רוח חזקה"),
    11: ("flooding", 3, "הצפה"),
    14: ("broken_down_vehicle", 1, "רכב תקול"),
}


class TomTomClient(IntegrationClient):
    name = "tomtom_traffic"
    cadence_seconds = 90
    purge_hours = 24  # ToS-mandated; do not extend
    stale_ttl_seconds = 0  # default = cadence*3

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key: Optional[str] = self.settings.tomtom_api_key

    def is_disabled(self) -> bool:
        if not self.api_key:
            logger.warning("TomTom client disabled — TOMTOM_API_KEY missing")
            return True
        return False

    async def fetch(self) -> List[NormalizedFeature]:
        if self.is_disabled():
            return []

        lat_min, lng_min, lat_max, lng_max = omer_bbox()
        # TomTom expects bbox as `minLng,minLat,maxLng,maxLat`.
        bbox = f"{lng_min},{lat_min},{lng_max},{lat_max}"
        params = {
            "key": self.api_key,
            "bbox": bbox,
            "fields": (
                "{incidents{type,geometry{type,coordinates},"
                "properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},"
                "startTime,endTime,from,to,length,delay,roadNumbers}}}"
            ),
            "language": "he-IL",
            "timeValidityFilter": "present",
        }
        async with httpx.AsyncClient(timeout=15.0) as http:
            response = await http.get(INCIDENT_DETAILS_URL, params=params)
            response.raise_for_status()
            data = response.json()

        incidents = data.get("incidents") or []
        out: List[NormalizedFeature] = []
        for incident in incidents:
            normalized = self._normalize(incident)
            if normalized is not None:
                out.append(normalized)
        return out

    @staticmethod
    def _representative_point(geometry: dict) -> Optional[tuple]:
        """Pick a representative (lat, lng) from a TomTom geometry block."""
        if not geometry:
            return None
        gtype = geometry.get("type")
        coords = geometry.get("coordinates")
        if not coords:
            return None
        if gtype == "Point":
            return (coords[1], coords[0])
        if gtype == "LineString":
            mid = coords[len(coords) // 2]
            return (mid[1], mid[0])
        if gtype == "MultiLineString" and coords and coords[0]:
            line = coords[0]
            mid = line[len(line) // 2]
            return (mid[1], mid[0])
        return None

    def _normalize(self, incident: dict) -> Optional[NormalizedFeature]:
        props = incident.get("properties") or {}
        geometry = incident.get("geometry") or {}
        point = self._representative_point(geometry)
        if point is None:
            return None
        lat, lng = point

        icon_cat = props.get("iconCategory")
        kind, severity_default, label = ICON_CATEGORY_MAP.get(int(icon_cat) if icon_cat is not None else -1, ("other", 1, "אירוע"))

        magnitude = props.get("magnitudeOfDelay")
        severity = severity_default
        if magnitude is not None:
            severity = max(0, min(3, int(magnitude)))

        events = props.get("events") or []
        event_desc = events[0].get("description") if events else None
        from_label = props.get("from")
        to_label = props.get("to")
        location = " — ".join(filter(None, [from_label, to_label]))

        name = event_desc or label
        if location:
            name = f"{name} ({location})"

        external_id = str(props.get("id") or "")
        if not external_id:
            return None

        return NormalizedFeature(
            external_id=external_id,
            kind=kind,
            name=name,
            description=event_desc,
            lat=lat,
            lng=lng,
            severity=severity,
            geom_polyline=geometry,
            payload={
                "iconCategory": icon_cat,
                "label_he": label,
                "magnitudeOfDelay": magnitude,
                "delay": props.get("delay"),
                "length": props.get("length"),
                "startTime": props.get("startTime"),
                "endTime": props.get("endTime"),
                "from": from_label,
                "to": to_label,
                "roadNumbers": props.get("roadNumbers"),
                "events": events,
            },
        )
