"""Single place where all integration clients are registered.

Importing this module is enough to populate `sync.REGISTRY`. Each new
client added in `Phase 1.1+` should be imported and registered here.
"""

import logging

from app.services.integrations.openmeteo_client import OpenMeteoClient
from app.services.integrations.oref_client import OrefClient
from app.services.integrations.sync import register_client
from app.services.integrations.tomtom_client import TomTomClient

logger = logging.getLogger(__name__)


def register_all() -> None:
    """Instantiate and register every Phase 1.0 client. Idempotent."""
    register_client(OpenMeteoClient())
    register_client(OrefClient())
    register_client(TomTomClient())
    logger.info("Integration clients registered: openmeteo_weather, oref_alert, tomtom_traffic")
