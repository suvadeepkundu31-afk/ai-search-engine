from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, ChatSession, ChatMessage
from app.schemas import ChatRequest, ChatResponse, Source
from app.search import retrieve
from app.vector_store import VectorStore
from app.dependencies import get_vector_store
from app.llm import llm
from app.config import settings

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "You are a helpful research assistant. Answer the user's question using only the provided context. "
    "If the context does not contain the answer, say so. Cite the source documents in your answer."
)


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    if request.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == request.session_id,
            ChatSession.user_id == current.id,
        ).first()
        if not session:
            raise HTTPException(404, "Chat session not found")
    else:
        session = ChatSession(user_id=current.id, title=request.query[:50])
        db.add(session)
        db.commit()
        db.refresh(session)

    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at).all()

    results = retrieve(request.query, current.id, db, vector_store, settings.TOP_K)
    context_blocks = [f"[Source: {r['filename']}]\n{r['text']}" for r in results]
    context_str = "\n---\n".join(context_blocks) if context_blocks else "No relevant context found."
    sources = [
        Source(
            chunk_id=r["chunk_id"],
            document_id=r["document_id"],
            filename=r["filename"],
            text=r["text"],
            score=r["score"],
        )
        for r in results
    ]

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({
        "role": "user",
        "content": f"Context:\n{context_str}\n\nQuestion: {request.query}",
    })

    answer = llm.chat(messages)

    db.add(ChatMessage(session_id=session.id, role="user", content=request.query))
    db.add(ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer,
        sources=[s.model_dump() for s in sources],
    ))
    db.commit()

    return ChatResponse(answer=answer, sources=sources, session_id=session.id)
