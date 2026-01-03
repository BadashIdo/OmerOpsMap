from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    jwt_expire_hours: int = 24  # New field, not in .env but has default
    host: str = "0.0.0.0"
    port: int = 8001
    
    # Initial admin (optional)
    initial_admin_username: str | None = None
    initial_admin_password: str | None = None
    initial_admin_display_name: str | None = None
    initial_admin_email: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()

