"""Application configuration."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Configuration
    SEED_API_KEY: str = ""
    SEED_API_BASE_URL: str = "https://ark.cn-beijing.volces.com/api/v3"
    SEED_MODEL: str = "doubao-seed-evolving"

    # App Configuration
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/ai_life_planner.db"

    # Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Embedding
    EMBEDDING_MODEL: str = "BAAI/bge-small-zh-v1.5"
    VECTOR_DB_PATH: str = "./data/faiss_index"

    # Allowed file types
    ALLOWED_EXTENSIONS: set = {"pdf", "docx", "txt", "md", "markdown"}

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Ensure directories exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.VECTOR_DB_PATH).mkdir(parents=True, exist_ok=True)
Path("./data").mkdir(parents=True, exist_ok=True)
