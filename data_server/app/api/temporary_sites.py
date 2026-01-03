from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.repository.temporary_sites import TemporarySitesRepository
from app.schemas.temporary_site import TemporarySiteCreate, TemporarySiteUpdate, TemporarySiteResponse
from app.auth.admin import verify_admin
from app.api.websocket import notify_data_changed

router = APIRouter(prefix="/api/temporary-sites", tags=["temporary-sites"])


@router.get("", response_model=List[TemporarySiteResponse])
async def get_all_temporary_sites(db: AsyncSession = Depends(get_db)):
    """Get all active temporary sites (public)"""
    repo = TemporarySitesRepository(db)
    sites = await repo.get_all_active()
    return sites


@router.get("/{site_id}", response_model=TemporarySiteResponse)
async def get_temporary_site(site_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single temporary site by ID (public)"""
    repo = TemporarySitesRepository(db)
    site = await repo.get_by_id(site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    return site


@router.post("", response_model=TemporarySiteResponse, status_code=status.HTTP_201_CREATED)
async def create_temporary_site(
    site_data: TemporarySiteCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Create a new temporary site (admin only)"""
    repo = TemporarySitesRepository(db)
    site = await repo.create(site_data)
    
    # Notify all clients about the new temporary event
    await notify_data_changed("temporary", "create", {"id": site.id, "name": site.name})
    
    return site


@router.put("/{site_id}", response_model=TemporarySiteResponse)
async def update_temporary_site(
    site_id: int,
    site_data: TemporarySiteUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Update a temporary site (admin only)"""
    repo = TemporarySitesRepository(db)
    site = await repo.update(site_id, site_data)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    
    # Notify all clients about the update
    await notify_data_changed("temporary", "update", {"id": site.id, "name": site.name})
    
    return site


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_temporary_site(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Delete a temporary site (admin only)"""
    repo = TemporarySitesRepository(db)
    success = await repo.delete(site_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    
    # Notify all clients about the deletion
    await notify_data_changed("temporary", "delete", {"id": site_id})
    
    return None

