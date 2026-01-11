"""
API endpoints for data import from Excel files
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict
import tempfile
import shutil
from pathlib import Path

from app.database import get_db
from app.auth.jwt import get_current_admin
from app.models.admin import Admin
from app.models.permanent_site import PermanentSite
from pydantic import BaseModel

# Import the parsing logic from the CLI script
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from import_excel_to_db import parse_excel, ImportLogger


router = APIRouter(prefix="/api/admin/import", tags=["import"])


class ImportPreviewResponse(BaseModel):
    """Response for import preview"""
    total_rows: int
    valid_sites: int
    errors: List[str]
    new_sites: List[str]  # List of new site names
    duplicate_sites: List[str]  # List of duplicate site names
    current_db_count: int
    
    class Config:
        from_attributes = True


class ImportExecuteRequest(BaseModel):
    """Request to execute import"""
    mode: str  # 'merge' or 'replace'
    

class ImportExecuteResponse(BaseModel):
    """Response after import execution"""
    success: bool
    message: str
    sites_added: int
    sites_deleted: int
    sites_skipped: int
    total_in_db: int
    
    class Config:
        from_attributes = True


@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    Preview what will be imported from Excel file without making changes.
    
    - **file**: Excel file (.xlsx)
    - Returns preview of changes
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel file (.xlsx or .xls)"
        )
    
    # Save uploaded file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name
    
    try:
        # Parse Excel file
        logger = ImportLogger(log_file=None)
        sites_to_create, errors = parse_excel(tmp_path, logger)
        
        # Get existing sites from database
        result = await db.execute(select(PermanentSite))
        existing_sites = result.scalars().all()
        existing_names = {site.name for site in existing_sites}
        
        # Categorize new vs duplicate
        new_sites = []
        duplicate_sites = []
        
        for site in sites_to_create:
            if site.name in existing_names:
                duplicate_sites.append(site.name)
            else:
                new_sites.append(site.name)
        
        return ImportPreviewResponse(
            total_rows=len(sites_to_create) + len(errors),
            valid_sites=len(sites_to_create),
            errors=errors,
            new_sites=new_sites[:50],  # Limit to first 50 for display
            duplicate_sites=duplicate_sites[:50],  # Limit to first 50
            current_db_count=len(existing_sites)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse Excel file: {str(e)}"
        )
    finally:
        # Clean up temp file
        Path(tmp_path).unlink(missing_ok=True)


@router.post("/execute", response_model=ImportExecuteResponse)
async def execute_import(
    request: ImportExecuteRequest,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    Execute the import from Excel file.
    
    - **file**: Excel file (.xlsx)
    - **mode**: 'merge' (add new only) or 'replace' (delete all and import)
    - Returns import results
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel file (.xlsx or .xls)"
        )
    
    # Validate mode
    if request.mode not in ['merge', 'replace']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be 'merge' or 'replace'"
        )
    
    # Save uploaded file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name
    
    try:
        # Parse Excel file
        logger = ImportLogger(log_file=None)
        sites_to_create, errors = parse_excel(tmp_path, logger)
        
        # Get existing sites
        result = await db.execute(select(PermanentSite))
        existing_sites = result.scalars().all()
        
        sites_added = 0
        sites_deleted = 0
        sites_skipped = 0
        
        if request.mode == 'replace':
            # Delete all existing sites
            for site in existing_sites:
                await db.delete(site)
            sites_deleted = len(existing_sites)
            await db.commit()
            
            # Add all new sites
            db.add_all(sites_to_create)
            sites_added = len(sites_to_create)
            
        else:  # merge mode
            # Filter out duplicates
            existing_names = {site.name for site in existing_sites}
            new_sites = [site for site in sites_to_create if site.name not in existing_names]
            sites_skipped = len(sites_to_create) - len(new_sites)
            
            # Add only new sites
            if new_sites:
                db.add_all(new_sites)
                sites_added = len(new_sites)
        
        await db.commit()
        
        # Get final count
        result = await db.execute(select(PermanentSite))
        final_sites = result.scalars().all()
        
        return ImportExecuteResponse(
            success=True,
            message=f"Import completed successfully in {request.mode} mode",
            sites_added=sites_added,
            sites_deleted=sites_deleted,
            sites_skipped=sites_skipped,
            total_in_db=len(final_sites)
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import data: {str(e)}"
        )
    finally:
        # Clean up temp file
        Path(tmp_path).unlink(missing_ok=True)
