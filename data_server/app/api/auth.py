from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repository.admins import AdminsRepository
from app.schemas.admin import AdminLogin, TokenResponse, AdminResponse
from app.auth.jwt import create_access_token, get_current_admin
from app.models.admin import Admin

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: AdminLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate admin and return JWT token
    """
    repo = AdminsRepository(db)
    admin = await repo.authenticate(login_data.username, login_data.password)
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="שם משתמש או סיסמה שגויים",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login time
    await repo.update_last_login(admin)
    
    # Create access token
    access_token = create_access_token(admin.id, admin.username)
    
    return TokenResponse(
        access_token=access_token,
        admin=AdminResponse.model_validate(admin)
    )


@router.get("/me", response_model=AdminResponse)
async def get_current_admin_info(
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Get current authenticated admin info
    """
    return AdminResponse.model_validate(current_admin)


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client-side token removal)
    The actual token invalidation happens on the client by removing the token
    """
    return {"message": "Successfully logged out"}


@router.post("/verify")
async def verify_token_endpoint(
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Verify if the current token is valid
    Returns admin info if valid, 401 if not
    """
    return {
        "valid": True,
        "admin": AdminResponse.model_validate(current_admin)
    }

