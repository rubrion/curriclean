from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: Literal["development", "production", "test"] = "development"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/specfit"

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    LOGFIRE_TOKEN: str = ""
    LOGFIRE_SEND_TO_LOGFIRE: str = "if-token-present"

    CORS_ORIGINS: str = "http://localhost:3000"

    BACKEND_JWT_SECRET: str = ""
    DAILY_TOKEN_BUDGET: int = 50_000

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "SpecFit <specfit@rubrion.ai>"
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    AUTH_SHARED_SECRET: str = ""

    BRAVE_API_KEY: str = ""
    BRAVE_SEARCH_URL: str = "https://api.search.brave.com/res/v1/web/search"
    CV_PDF_MAX_BYTES: int = 5_000_000

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def sync_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url.replace("+asyncpg", "").replace("postgresql://", "postgresql+psycopg://")


@lru_cache
def get_settings() -> Settings:
    return Settings()
