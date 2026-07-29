from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Document
from app.schemas import DocumentOut
from app.documents import process_upload
from app.vector_store import VectorStore
from app.dependencies import get_vector_store

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentOut)
def upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    return process_upload(file, current.id, db, vector_store)


@router.get("", response_model=list[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    return db.query(Document).filter(Document.user_id == current.id).order_by(Document.created_at.desc()).all()
