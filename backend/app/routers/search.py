from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.schemas import SearchResult
from app.search import retrieve
from app.vector_store import VectorStore
from app.dependencies import get_vector_store
from app.config import settings

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=list[SearchResult])
def search(
    q: str,
    k: int = settings.TOP_K,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    results = retrieve(q, current.id, db, vector_store, k)
    return [SearchResult(**r) for r in results]
