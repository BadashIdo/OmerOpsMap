from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.repository.site_requests import SiteRequestsRepository
from app.schemas.site_request import (
    SiteRequestCreate, 
    SiteRequestUpdate, 
    SiteRequestResponse,
    SiteRequestPublicResponse,
    RejectRequest,
    RequestCountResponse
)
from app.models.site_request import RequestStatus
from app.auth.jwt import get_current_admin
from app.models.admin import Admin

router = APIRouter(prefix="/api/requests", tags=["requests"])


# ===== Public Endpoints =====

@router.post("", response_model=SiteRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_request(
    _: SiteRequestCreate,
    __: AsyncSession = Depends(get_db)
):
    """
    Public request submission is disabled.
    """
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="אפשרות הגשת בקשות כבויה כרגע"
    )


@router.get("/status/{request_id}", response_model=SiteRequestPublicResponse)
async def check_request_status(
    request_id: int,
    phone: str = Query(..., description="טלפון המדווח לאימות"),
    db: AsyncSession = Depends(get_db)
):
    """
    Check status of own request (requires submitter phone for verification)
    """
    repo = SiteRequestsRepository(db)
    request = await repo.get_by_id(request_id)
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="בקשה לא נמצאה")
    
    # Verify ownership
    if request.submitter_phone != phone:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="אין הרשאה לצפות בבקשה זו")
    
    return request


# ===== Admin Endpoints =====

@router.get("", response_model=List[SiteRequestResponse])
async def get_requests(
    status: Optional[RequestStatus] = None,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin)
):
    """
    Get all requests, optionally filtered by status (admin only)
    """
    repo = SiteRequestsRepository(db)
    requests = await repo.get_all(status)
    return requests


@router.get("/pending", response_model=List[SiteRequestResponse])
async def get_pending_requests(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin)
):
    """
    Get all pending requests (admin only)
    """
    repo = SiteRequestsRepository(db)
    requests = await repo.get_pending()
    return requests


@router.get("/count", response_model=RequestCountResponse)
async def get_pending_count(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin)
):
    """
    Get count of pending requests for badge (admin only)
    """
    repo = SiteRequestsRepository(db)
    count = await repo.get_count_pending()
    return RequestCountResponse(pending_count=count)


@router.get("/{request_id}", response_model=SiteRequestResponse)
async def get_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin)
):
    """
    Get a single request by ID (admin only)
    """
    repo = SiteRequestsRepository(db)
    request = await repo.get_by_id(request_id)
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="בקשה לא נמצאה")
    
    return request


@router.put("/{request_id}", response_model=SiteRequestResponse)
async def update_request(
    request_id: int,
    request_data: SiteRequestUpdate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin)
):
    """
    Update/edit a request before approval (admin only)
    """
    repo = SiteRequestsRepository(db)
    request = await repo.update(request_id, request_data)
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="בקשה לא נמצאה")
    
    return request


@router.post("/{request_id}/approve")
async def approve_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    Approve a request and create the site (admin only)
    """
    repo = SiteRequestsRepository(db)
    result = await repo.approve(request_id, admin.id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="לא ניתן לאשר בקשה זו (אולי כבר טופלה)"
        )
    
    # Notify about new site
    await notify_data_changed(result["site_type"], "create", {
        "id": result["site_id"],
        "name": result["site_name"]
    })
    
    # Notify about request status change
    await notify_data_changed("request", "approved", {"id": request_id})
    
    return {
        "message": "הבקשה אושרה והאתר נוסף למפה",
        "site_type": result["site_type"],
        "site_id": result["site_id"]
    }


@router.post("/{request_id}/reject")
async def reject_request(
    request_id: int,
    reject_data: RejectRequest,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    Reject a request with reason (admin only)
    """
    repo = SiteRequestsRepository(db)
    request = await repo.reject(request_id, admin.id, reject_data.reason)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="לא ניתן לדחות בקשה זו (אולי כבר טופלה)"
        )
    
    # Notify about request rejection
    await notify_data_changed("request", "rejected", {
        "id": request_id,
        "reason": reject_data.reason
    })
    
    return {"message": "הבקשה נדחתה", "reason": reject_data.reason}


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin)
):
    """
    Delete a request (admin only)
    """
    repo = SiteRequestsRepository(db)
    success = await repo.delete(request_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="בקשה לא נמצאה")
    
    return None

