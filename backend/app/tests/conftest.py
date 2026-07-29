import os
import tempfile
import pytest
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("FAISS_INDEX_PATH", os.path.join(tempfile.gettempdir(), "test_faiss.index"))
os.environ.setdefault("UPLOAD_DIR", os.path.join(tempfile.gettempdir(), "test_uploads"))

from app import main as app_main  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.dependencies import get_vector_store  # noqa: E402
from app.embedding import embedding_engine  # noqa: E402
from app.llm import llm  # noqa: E402

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Point the app at the test database so lifespan creates tables in the same connection used by requests.
app_main.engine = engine


class FakeVectorStore:
    def __init__(self, dim: int):
        self.dim = dim
        self.index = {}

    def add(self, ids, vectors):
        for id_ in ids:
            self.index[id_] = True

    def search(self, vector, k):
        ids = list(self.index.keys())[:k]
        if not ids:
            return np.array([]), np.array([])
        return np.array([0.9] * len(ids)), np.array(ids, dtype=np.int64)


class FakeEmbeddingEngine:
    def embed(self, texts):
        if isinstance(texts, str):
            texts = [texts]
        return np.ones((len(texts), 8), dtype=np.float32)

    @property
    def dimension(self):
        return 8


@pytest.fixture
def fake_vector_store():
    return FakeVectorStore(8)


@pytest.fixture
def fake_embedding_engine():
    return FakeEmbeddingEngine()


@pytest.fixture
def fake_llm():
    def _chat(messages, **kwargs):
        return "This is a test answer based on the context."
    return _chat


@pytest.fixture
def fake_llm_stream():
    def _stream(messages, **kwargs):
        for token in ["Test", " answer", " based", " on", " context", "."]:
            yield token
    return _stream


@pytest.fixture
def client(fake_vector_store, fake_embedding_engine, fake_llm, fake_llm_stream):
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    embedding_engine.embed = fake_embedding_engine.embed
    embedding_engine.dim = fake_embedding_engine.dimension
    llm.chat = fake_llm
    llm.chat_stream = fake_llm_stream

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_vector_store] = lambda: fake_vector_store

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
