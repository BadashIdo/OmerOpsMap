"""Pytest configuration shared across the suite.

Tests in `data_server/tests` are split into two tiers:
  * Pure-Python unit tests — geofence, client normalization with httpx mocked.
  * DB-dependent integration tests — gated on `RUN_DB_TESTS=1`; require a
    live Postgres reachable via DATABASE_URL.
"""

import asyncio
import os
import sys
from pathlib import Path

import pytest

# Ensure `app.*` imports resolve when pytest is invoked from data_server/.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Provide harmless defaults for env-driven settings so config import doesn't fail.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/testdb")


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def fixtures_dir() -> Path:
    return Path(__file__).parent / "fixtures"
