from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.admin import Admin
from app.auth.jwt import get_current_admin, security, verify_token
from app.repository.admins import AdminsRepository

settings = get_settings()


async def verify_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    db: AsyncSession = Depends(get_db)
) -> Union[Admin, bool]:
    """
    Verify admin authentication via JWT token or legacy X-Admin-Key header
    Supports both methods for backwards compatibility
    """
    # Try JWT authentication first
    if credentials is not None:
        try:
            admin = await get_current_admin(credentials, db)
            return admin
        except HTTPException:
            pass
    
    # Fall back to legacy X-Admin-Key
    if x_admin_key is not None:
        if x_admin_key == settings.admin_password:
            return True
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

