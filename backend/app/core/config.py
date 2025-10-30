from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGO: str = "HS256"
    JWT_ACCESS_EXPIRE_MIN: int = 30
    JWT_REFRESH_EXPIRE_MIN: int = 43200  # 30 days
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173"

    # LLM / AI
    ANTHROPIC_API_KEY: str | None = None
    THE_ODDS_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ALLOWED_ORIGINS into a list."""
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",")]


settings = Settings()
