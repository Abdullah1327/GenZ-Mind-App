from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import dotenv_values

# Load values directly from backend .env
_env_vals = dotenv_values(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))


class Settings(BaseSettings):
    # App
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # Supabase (for verifying tokens if needed)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # AI Provider — easily switchable
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # FAISS vector store
    FAISS_INDEX_DIR: str = "./faiss_indexes"

    # Embedding model
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIM: int = 384

    # Document processing
    CHUNK_SIZE: int = 400       # characters per chunk
    CHUNK_OVERLAP: int = 80     # overlap between consecutive chunks
    MAX_RETRIEVED_CHUNKS: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Force project .env key if present, overriding any broken system environment variable
if _env_vals.get("GROQ_API_KEY") and _env_vals["GROQ_API_KEY"].startswith("gsk_"):
    settings.GROQ_API_KEY = _env_vals["GROQ_API_KEY"]
elif settings.GROQ_API_KEY and settings.GROQ_API_KEY.startswith("hergsk_"):
    settings.GROQ_API_KEY = settings.GROQ_API_KEY[3:]

# Ensure FAISS index directory exists
os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)

