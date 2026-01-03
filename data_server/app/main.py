from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.router import api_router
from app.services.expiry_scheduler import start_scheduler, stop_scheduler

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
                return
            
            admin_data = AdminCreate(
                username=initial_username,
                password=initial_password,
                display_name=os.getenv("INITIAL_ADMIN_DISPLAY_NAME", "מנהל ראשי"),
                email=os.getenv("INITIAL_ADMIN_EMAIL"),
            )
            
            admin = await repo.create(admin_data)
            logger.info(f"✓ Initial admin created: {admin.username}")
    except Exception as e:
        logger.warning(f"Could not create initial admin: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting OmerOpsMap Data Server...")
    
    # Create initial admin if configured
    await init_admin()
    
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router)


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

