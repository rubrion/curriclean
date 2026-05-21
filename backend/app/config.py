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

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def sync_database_url(self) -> str:
        return self.DATABASE_URL.replace("+asyncpg", "").replace(
            "postgresql://", "postgresql+psycopg://"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
