from fastapi import APIRouter
from app.api import permanent_sites, temporary_sites, websocket, auth, import_data, export_data

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth.router)
api_router.include_router(permanent_sites.router)
api_router.include_router(temporary_sites.router)
api_router.include_router(import_data.router)
api_router.include_router(export_data.router)
api_router.include_router(websocket.router)

