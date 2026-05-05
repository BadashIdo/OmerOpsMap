"""Geofence helpers: pure functions, fast tests."""

from app.services.integrations.geofence import (
    OMER_CENTER,
    OMER_RADIUS_KM,
    haversine_km,
    omer_bbox,
    point_in_omer,
)


def test_omer_center_is_in_omer():
    lat, lng = OMER_CENTER
    assert point_in_omer(lat, lng) is True


def test_beer_sheva_center_is_outside_omer():
    # Beer Sheva center ~ (31.252, 34.79) — more than 5 km from Omer center.
    assert point_in_omer(31.252, 34.79) is False


def test_a_few_meters_from_center_is_inside():
    lat, lng = OMER_CENTER
    assert point_in_omer(lat + 0.0001, lng + 0.0001) is True


def test_far_away_is_outside():
    # Tel Aviv is ~95 km away.
    assert point_in_omer(32.0853, 34.7818) is False


def test_handles_none_safely():
    assert point_in_omer(None, None) is False
    assert point_in_omer(31.2, None) is False


def test_haversine_zero_for_same_point():
    lat, lng = OMER_CENTER
    assert haversine_km(lat, lng, lat, lng) == 0.0


def test_haversine_known_distance():
    # Omer to Beer Sheva center is roughly 6–8 km.
    distance = haversine_km(OMER_CENTER[0], OMER_CENTER[1], 31.252, 34.79)
    assert 4.0 <= distance <= 12.0


def test_omer_bbox_contains_center():
    lat_min, lng_min, lat_max, lng_max = omer_bbox()
    assert lat_min < OMER_CENTER[0] < lat_max
    assert lng_min < OMER_CENTER[1] < lng_max


def test_omer_bbox_size_matches_radius():
    lat_min, _, lat_max, _ = omer_bbox()
    span_km = (lat_max - lat_min) * 111.0 / 2  # half-span ~ radius
    assert abs(span_km - OMER_RADIUS_KM) < 0.5
