"""Sync orchestrator: circuit breaker behavior + filter logic.

DB and WS dependencies are stubbed — these tests pin the control-flow
contract (when do we mark stale, when do we broadcast, when do we skip).
"""

import pytest

from app.services.integrations.sync import CircuitBreaker, _filter_to_omer
from app.services.integrations.base import NormalizedFeature
from app.services.integrations.geofence import OMER_CENTER


def test_filter_to_omer_drops_far_points():
    rows = [
        NormalizedFeature(
            external_id="in",
            kind="x",
            name="In",
            description=None,
            lat=OMER_CENTER[0],
            lng=OMER_CENTER[1],
        ),
        NormalizedFeature(
            external_id="out",
            kind="x",
            name="Out",
            description=None,
            lat=32.0,
            lng=34.7,
        ),
    ]
    kept = _filter_to_omer(rows)
    assert [r.external_id for r in kept] == ["in"]


def test_breaker_closed_initially():
    cb = CircuitBreaker()
    assert cb.is_open() is False


def test_breaker_opens_after_threshold_failures():
    cb = CircuitBreaker(failure_threshold=3, backoff_multiplier=2)
    for _ in range(3):
        cb.record_failure()
    assert cb.is_open() is True


def test_breaker_skips_runs_during_backoff():
    cb = CircuitBreaker(failure_threshold=3, backoff_multiplier=2)
    for _ in range(3):
        cb.record_failure()
    # Backoff window: 2 skipped runs.
    assert cb.is_open() is True  # skip 1
    assert cb.is_open() is True  # skip 2
    # After backoff window, allows a probe.
    assert cb.is_open() is False


def test_breaker_resets_on_success():
    cb = CircuitBreaker(failure_threshold=3)
    for _ in range(3):
        cb.record_failure()
    cb.record_success()
    assert cb.is_open() is False
    assert cb.consecutive_failures == 0
