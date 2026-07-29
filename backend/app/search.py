from sqlalchemy.orm import Session
from app.models import Chunk
from app.embedding import embedding_engine
from app.vector_store import VectorStore
from app.config import settings


def retrieve(query: str, user_id: int, db: Session, vector_store: VectorStore, k: int = settings.TOP_K):
    vectors = embedding_engine.embed([query])
    distances, ids = vector_store.search(vectors[0], k)
    results = []
    for score, chunk_id in zip(distances, ids):
        if chunk_id == -1:
            continue
        chunk = db.query(Chunk).filter(Chunk.id == int(chunk_id)).first()
        if chunk and chunk.document and chunk.document.user_id == user_id:
            results.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "filename": chunk.document.filename,
                "text": chunk.text,
                "score": float(score),
            })
    return results
