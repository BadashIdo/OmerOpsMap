#!/bin/sh
# Migration script to run inside Docker
export DATABASE_URL="postgresql+asyncpg://omeropsmap:omeropsmap_dev_pass@postgres:5432/omeropsmap"
alembic upgrade head

