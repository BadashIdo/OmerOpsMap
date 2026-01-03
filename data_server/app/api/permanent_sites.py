from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.repository.permanent_sites import PermanentSitesRepository
from app.schemas.permanent_site import PermanentSiteCreate, PermanentSiteUpdate, PermanentSiteResponse
from app.auth.admin import verify_admin
from app.api.websocket import notify_data_changed

router = APIRouter(prefix="/api/permanent-sites", tags=["permanent-sites"])


@router.get("", response_model=List[PermanentSiteResponse])
async def get_all_permanent_sites(db: AsyncSession = Depends(get_db)):
    """Get all permanent sites (public)"""
    repo = PermanentSitesRepository(db)
    sites = await repo.get_all()
    return sites


@router.get("/{site_id}", response_model=PermanentSiteResponse)
async def get_permanent_site(site_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single permanent site by ID (public)"""
    repo = PermanentSitesRepository(db)
    site = await repo.get_by_id(site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    return site


@router.post("", response_model=PermanentSiteResponse, status_code=status.HTTP_201_CREATED)
async def create_permanent_site(
    site_data: PermanentSiteCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Create a new permanent site (admin only)"""
    repo = PermanentSitesRepository(db)
    site = await repo.create(site_data)
    
    # Notify all clients about the new site
    await notify_data_changed("permanent", "create", {"id": site.id, "name": site.name})
    
    return site


@router.put("/{site_id}", response_model=PermanentSiteResponse)
async def update_permanent_site(
    site_id: int,
    site_data: PermanentSiteUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Update a permanent site (admin only)"""
    repo = PermanentSitesRepository(db)
    site = await repo.update(site_id, site_data)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    
    # Notify all clients about the update
    await notify_data_changed("permanent", "update", {"id": site.id, "name": site.name})
    
    return site


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permanent_site(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Delete a permanent site (admin only)"""
    repo = PermanentSitesRepository(db)
    success = await repo.delete(site_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    
    # Notify all clients about the deletion
    await notify_data_changed("permanent", "delete", {"id": site_id})
    
    return None

