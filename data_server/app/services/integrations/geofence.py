"""Geofence helpers for filtering external features to the Omer area.

Single source of truth for the Omer center, radius, and bounding box.
The frontend mirrors `OMER_CENTER` and `OMER_RADIUS_KM` in
`front/src/lib/constants.js` — keep both in sync.
"""

from math import asin, cos, radians, sin, sqrt
from typing import Tuple

OMER_CENTER: Tuple[float, float] = (31.2632, 34.8419)
OMER_RADIUS_KM: float = 5.0

EARTH_RADIUS_KM: float = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometers between two lat/lng points."""
    rlat1, rlng1, rlat2, rlng2 = map(radians, (lat1, lng1, lat2, lng2))
    dlat = rlat2 - rlat1
    dlng = rlng2 - rlng1
    a = sin(dlat / 2) ** 2 + cos(rlat1) * cos(rlat2) * sin(dlng / 2) ** 2
    c = 2 * asin(sqrt(a))
    return EARTH_RADIUS_KM * c


def point_in_omer(lat: float, lng: float, radius_km: float = OMER_RADIUS_KM) -> bool:
    """Return True when the point falls within `radius_km` of Omer center."""
    if lat is None or lng is None:
        return False
    return haversine_km(OMER_CENTER[0], OMER_CENTER[1], lat, lng) <= radius_km


def omer_bbox(radius_km: float = OMER_RADIUS_KM) -> Tuple[float, float, float, float]:
    """Bounding box (lat_min, lng_min, lat_max, lng_max) enclosing the radius circle.

    Use for APIs that accept a bbox; always re-filter with `point_in_omer`
    afterwards to enforce the circular boundary.
    """
    lat, lng = OMER_CENTER
    lat_delta = radius_km / 111.0
    lng_delta = radius_km / (111.0 * cos(radians(lat)))
    return (lat - lat_delta, lng - lng_delta, lat + lat_delta, lng + lng_delta)
