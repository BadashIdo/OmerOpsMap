"""
Startup script to create initial admin if not exists
Run this on application startup
"""
import asyncio
import os
from app.database import AsyncSessionLocal
from app.repository.admins import AdminsRepository
from app.schemas.admin import AdminCreate


async def create_initial_admin():
    """Create initial admin user if it doesn't exist"""
    
    # Get credentials from environment
    initial_username = os.getenv("INITIAL_ADMIN_USERNAME", "admin")
    initial_password = os.getenv("INITIAL_ADMIN_PASSWORD")
    initial_display_name = os.getenv("INITIAL_ADMIN_DISPLAY_NAME", "מנהל ראשי")
    initial_email = os.getenv("INITIAL_ADMIN_EMAIL")
    
    # Skip if no password provided
    if not initial_password:
        print("No INITIAL_ADMIN_PASSWORD provided, skipping initial admin creation")
        return
    
    async with AsyncSessionLocal() as session:
        repo = AdminsRepository(session)
        
        # Check if admin already exists
        existing = await repo.get_by_username(initial_username)
        if existing:
            print(f"Admin '{initial_username}' already exists, skipping creation")
            return
        
        # Create admin
        admin_data = AdminCreate(
            username=initial_username,
            password=initial_password,
            display_name=initial_display_name,
            email=initial_email,
        )
        
        admin = await repo.create(admin_data)
        print(f"✓ Initial admin created: {admin.username}")


if __name__ == "__main__":
    asyncio.run(create_initial_admin())

