from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://aise:aise@localhost:5432/aise"
    SECRET_KEY: str = "change-me-in-production"
    OPENAI_API_KEY: str | None = None

    EMBEDDING_PROVIDER: str = "sentence-transformers"  # or "openai"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"

    FAISS_INDEX_PATH: str = "./data/faiss.index"
    UPLOAD_DIR: str = "./data/uploads"

    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    TOP_K: int = 5

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
