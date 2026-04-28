"""IntegrationClient abstract base class plus value types shared by all sources.

A new external source becomes a subclass of `IntegrationClient` plus an entry
in the `REGISTRY` (defined in `sync.py`). The orchestrator handles the rest.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, List, Optional


@dataclass
class NormalizedFeature:
    """A source-agnostic feature row destined for `external_features`.

    `external_id` may be None for sources that don't expose stable ids
    (e.g. weather grid cells). Such rows are upserted by spatial key
    instead, handled in the repository layer.
    """
    external_id: Optional[str]
    kind: str
    name: str
    description: Optional[str]
    lat: float
    lng: float
    severity: Optional[int] = None
    geom_polyline: Optional[Any] = None
    payload: dict = field(default_factory=dict)
    expires_at: Optional[Any] = None  # datetime; deferred import to avoid circulars


@dataclass
class RunResult:
    ok: bool
    added: int = 0
    updated: int = 0
    removed: int = 0
    reason: Optional[str] = None


class IntegrationClient(ABC):
    """One client per external source. Pure data fetcher — never writes to DB.

    Subclasses set:
      - `name`            — used as the `external_source` enum value
      - `cadence_seconds` — APScheduler interval
      - `stale_ttl_seconds` — override default mark-stale window (0 = use cadence*3)
      - `purge_hours`     — hard-delete window for stale rows
      - `radius_km`       — per-source geofence radius. 0 = use the global
                            `settings.omer_radius_km`. Sources whose data
                            naturally extends beyond Omer (e.g. TomTom traffic
                            on access roads through Beer Sheva) override this.
    """

    name: str = ""
    cadence_seconds: int = 300
    stale_ttl_seconds: int = 0
    purge_hours: int = 24
    radius_km: float = 0.0

    def is_disabled(self) -> bool:
        """Override to skip registration when required secrets are missing."""
        return False

    @abstractmethod
    async def fetch(self) -> List[NormalizedFeature]:
        """Pull current state from the upstream API.

        Implementations must return all features the source currently knows
        about within or near the Omer geofence; the orchestrator filters
        further with `point_in_omer`.
        """
        raise NotImplementedError
