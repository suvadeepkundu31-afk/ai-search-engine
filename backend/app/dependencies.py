from app.vector_store import VectorStore
from app.embedding import embedding_engine

_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore(embedding_engine.dimension)
    return _vector_store
