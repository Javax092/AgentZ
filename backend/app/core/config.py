from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "LeadFlow AI API"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = Field(default=8000, validation_alias=AliasChoices("APP_PORT", "PORT"))
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/leadflow"
    cors_origins: str = "http://localhost:5173"
    auth_jwt_secret: str = "change-me-in-production"
    auth_access_token_ttl_seconds: int = 3600
    auth_password_iterations: int = 600000
    default_admin_name: str = "LeadFlow Admin"
    default_admin_email: str = ""
    default_admin_password: str = ""
    gemini_api_key: str = ""
    gemini_provider_name: str = "gemini"
    gemini_model: str = "gemini-1.5-flash"
    gemini_timeout_seconds: float = 20.0
    gemini_enabled: bool = False

    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
