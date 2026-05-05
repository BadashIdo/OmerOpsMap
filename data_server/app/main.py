from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging, os

from app.api.router import api_router
from app.services.expiry_scheduler import start_scheduler, stop_scheduler
from app.config import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_admin():
    """Create initial admin user if environment variables are set"""
    import os
    from app.database import AsyncSessionLocal
    from app.repository.admins import AdminsRepository
    from app.schemas.admin import AdminCreate

    initial_password = os.getenv("INITIAL_ADMIN_PASSWORD")
    if not initial_password:
        return

    initial_username = os.getenv("INITIAL_ADMIN_USERNAME", "admin")

    try:
        async with AsyncSessionLocal() as session:
            repo = AdminsRepository(session)
            existing = await repo.get_by_username(initial_username)

            if existing:
                logger.info(f"Admin '{initial_username}' already exists")
            else:
                admin_data = AdminCreate(
                    username=initial_username,
                    password=initial_password,
                    display_name=os.getenv("INITIAL_ADMIN_DISPLAY_NAME", "מנהל ראשי"),
                    email=os.getenv("INITIAL_ADMIN_EMAIL"),
                    role="admin"
                )

                admin = await repo.create(admin_data)
                logger.info(f"✓ Initial admin created: {admin.username}")
    except Exception as e:
        logger.warning(f"Could not create initial admin: {e}")


async def init_subadmin():
    """Create initial subadmin user if environment variables are set"""
    import os
    from app.database import AsyncSessionLocal
    from app.repository.admins import AdminsRepository
    from app.schemas.admin import AdminCreate

    subadmin_password = os.getenv("INITIAL_SUBADMIN_PASSWORD")
    if not subadmin_password:
        return

    subadmin_username = os.getenv("INITIAL_SUBADMIN_USERNAME", "power_user")

    try:
        async with AsyncSessionLocal() as session:
            repo = AdminsRepository(session)
            existing = await repo.get_by_username(subadmin_username)

            if existing:
                logger.info(f"Subadmin '{subadmin_username}' already exists")
            else:
                admin_data = AdminCreate(
                    username=subadmin_username,
                    password=subadmin_password,
                    display_name=os.getenv("INITIAL_SUBADMIN_DISPLAY_NAME", "מנהל משנה"),
                    email=os.getenv("INITIAL_SUBADMIN_EMAIL"),
                    role="subadmin"
                )

                admin = await repo.create(admin_data)
                logger.info(f"✓ Initial subadmin created: {admin.username}")
    except Exception as e:
        logger.warning(f"Could not create initial subadmin: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting OmerOpsMap Data Server...")

    # Create initial admin if configured
    await init_admin()

    # Create initial subadmin if configured
    await init_subadmin()

    start_scheduler()
    logger.info("Expiry scheduler started")

    yield

    # Shutdown
    logger.info("Shutting down OmerOpsMap Data Server...")
    stop_scheduler()
    logger.info("Expiry scheduler stopped")


app = FastAPI(
    title="OmerOpsMap Data Server",
    version="1.0.0",
    description="Backend data server for OmerOpsMap with PostgreSQL and real-time updates",
    lifespan=lifespan
)

# CORS configuration - allow frontend to access API
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router)

# Serve uploaded files (feedback photos etc.)
_uploads_dir = "/app/uploads"
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")


@app.get("/")
async def root():
    return {
        "message": "OmerOpsMap Data Server",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

