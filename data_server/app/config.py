from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    jwt_expire_hours: int = 24  # New field, not in .env but has default
    host: str = "0.0.0.0"
    port: int = 8001
    
    # CORS configuration - allows Railway and localhost
    allowed_origins: str = "*"
    
    # Initial admin (optional)
    initial_admin_username: str | None = None
    initial_admin_password: str | None = None
    initial_admin_display_name: str | None = None
    initial_admin_email: str | None = None

    # External integrations
    external_sync_enabled: bool = True
    omer_radius_km: float = 5.0

    # API keys (each integration self-disables when its key is missing)
    tomtom_api_key: str | None = None
    openweather_api_key: str | None = None
    ims_api_token: str | None = None
    firms_api_key: str | None = None
    gmaps_api_key: str | None = None
    waze_partner_token: str | None = None

    # Pikud Haoref poll cadence (seconds). Active = right after a hit.
    oref_active_poll_secs: int = 5
    oref_idle_poll_secs: int = 30

    # Test/dev overrides — point clients at fixture files instead of real APIs
    oref_stub_path: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()

