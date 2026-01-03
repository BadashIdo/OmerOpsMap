from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone
from passlib.context import CryptContext

from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminUpdate

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


class AdminsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, admin_id: int) -> Optional[Admin]:
        """Get admin by ID"""
        result = await self.session.execute(
            select(Admin).where(Admin.id == admin_id)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[Admin]:
        """Get admin by username"""
        result = await self.session.execute(
            select(Admin).where(Admin.username == username)
        )
        return result.scalar_one_or_none()

    async def create(self, admin_data: AdminCreate) -> Admin:
        """Create a new admin"""
        admin = Admin(
            username=admin_data.username,
            password_hash=hash_password(admin_data.password),
            display_name=admin_data.display_name,
            email=admin_data.email,
        )
        self.session.add(admin)
        await self.session.commit()
        await self.session.refresh(admin)
        return admin

    async def update(self, admin_id: int, admin_data: AdminUpdate) -> Optional[Admin]:
        """Update an existing admin"""
        admin = await self.get_by_id(admin_id)
        if not admin:
            return None

        update_data = admin_data.model_dump(exclude_unset=True)
        
        # Hash password if provided
        if "password" in update_data:
            update_data["password_hash"] = hash_password(update_data.pop("password"))
        
        for key, value in update_data.items():
            setattr(admin, key, value)

        await self.session.commit()
        await self.session.refresh(admin)
        return admin

    async def update_last_login(self, admin: Admin) -> Admin:
        """Update last login timestamp"""
        admin.last_login = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(admin)
        return admin

    async def authenticate(self, username: str, password: str) -> Optional[Admin]:
        """Authenticate admin with username and password"""
        admin = await self.get_by_username(username)
        if not admin:
            return None
        if not admin.is_active:
            return None
        if not verify_password(password, admin.password_hash):
            return None
        return admin

    async def delete(self, admin_id: int) -> bool:
        """Delete an admin"""
        admin = await self.get_by_id(admin_id)
        if not admin:
            return False

        await self.session.delete(admin)
        await self.session.commit()
        return True

