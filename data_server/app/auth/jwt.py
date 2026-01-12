from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.admin import Admin
from app.repository.admins import AdminsRepository

settings = get_settings()

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


def create_access_token(admin_id: int, username: str) -> str:
    """
    Create a JWT access token for an admin
    Token contains admin_id and username in the payload
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    
    payload = {
        "sub": str(admin_id),
        "username": username,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }
    
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return token


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token
    Returns the payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Admin:
    """
    Dependency to get the current authenticated admin
    Raises 401 if not authenticated or invalid token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if credentials is None:
        raise credentials_exception
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise credentials_exception
    
    admin_id = payload.get("sub")
    if admin_id is None:
        raise credentials_exception
    
    try:
        admin_id = int(admin_id)
    except ValueError:
        raise credentials_exception
    
    repo = AdminsRepository(db)
    admin = await repo.get_by_id(admin_id)
    
    if admin is None or not admin.is_active:
        raise credentials_exception
    
    return admin


async def get_optional_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[Admin]:
    """
    Dependency to optionally get the current admin
    Returns None if not authenticated (doesn't raise)
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_admin(credentials, db)
    except HTTPException:
        return None

