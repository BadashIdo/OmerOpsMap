#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

# Auto-import data if database is empty
echo "Checking if data needs to be imported..."
python3 << 'PYTHON_EOF'
import asyncio
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.permanent_site import PermanentSite
from scripts.import_excel_to_db import parse_excel, ImportLogger

EXCEL_PATH = Path(__file__).parent / "data" / "Omer_GIS_Reorganized_Final.xlsx"

async def auto_import():
    async with AsyncSessionLocal() as session:
        # Check if any sites exist
        result = await session.execute(select(func.count()).select_from(PermanentSite))
        count = result.scalar()

        if count > 0:
            print(f"ℹ️  Database already has {count} sites, skipping auto-import")
            return

        if not EXCEL_PATH.exists():
            print(f"⚠️  Excel file not found: {EXCEL_PATH}")
            return

        print(f"📊 Database is empty, auto-importing from {EXCEL_PATH.name}...")

        logger = ImportLogger(log_file=None)
        sites_to_create, errors = parse_excel(str(EXCEL_PATH), logger)

        if sites_to_create:
            session.add_all(sites_to_create)
            await session.commit()
            print(f"✅ Auto-imported {len(sites_to_create)} sites")
        else:
            print("⚠️  No valid sites found in Excel")

        if errors:
            print(f"⚠️  {len(errors)} rows had errors")

asyncio.run(auto_import())
PYTHON_EOF

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload