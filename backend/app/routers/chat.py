from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, ChatSession, ChatMessage
from app.schemas import ChatRequest, ChatResponse, Source, ChatSessionOut, ChatMessageOut
from app.search import retrieve
from app.vector_store import VectorStore
from app.dependencies import get_vector_store
from app.llm import llm
from app.config import settings
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "You are Zeee, a helpful research assistant. Answer the user's question using only the provided context. "
    "If the context does not contain the answer, say so. Cite the source documents in your answer."
)


def _get_or_create_session(db: Session, user: User, session_id: int | None, title: str) -> ChatSession:
    if session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user.id,
        ).first()
        if not session:
            raise HTTPException(404, "Chat session not found")
        return session
    session = ChatSession(user_id=user.id, title=title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _build_messages(history: list[ChatMessage], query: str, context_str: str) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({
        "role": "user",
        "content": f"Context:\n{context_str}\n\nQuestion: {query}",
    })
    return messages


def _sources_from_results(results: list[dict]) -> list[Source]:
    return [
        Source(
            chunk_id=r["chunk_id"],
            document_id=r["document_id"],
            filename=r["filename"],
            text=r["text"],
            score=r["score"],
        )
        for r in results
    ]


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    session = _get_or_create_session(db, current, request.session_id, request.query[:50])
    history = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()

    results = retrieve(request.query, current.id, db, vector_store, settings.TOP_K)
    context_blocks = [f"[Source: {r['filename']}]\n{r['text']}" for r in results]
    context_str = "\n---\n".join(context_blocks) if context_blocks else "No relevant context found."
    sources = _sources_from_results(results)

    messages = _build_messages(history, request.query, context_str)

    try:
        answer = llm.chat(messages)
    except RuntimeError as exc:
        answer = f"[LLM unavailable: {exc}]"

    db.add(ChatMessage(session_id=session.id, role="user", content=request.query))
    db.add(ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer,
        sources=[s.model_dump() for s in sources],
    ))
    db.commit()

    return ChatResponse(answer=answer, sources=sources, session_id=session.id)


@router.post("/stream")
def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    session = _get_or_create_session(db, current, request.session_id, request.query[:50])
    history = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()

    results = retrieve(request.query, current.id, db, vector_store, settings.TOP_K)
    context_blocks = [f"[Source: {r['filename']}]\n{r['text']}" for r in results]
    context_str = "\n---\n".join(context_blocks) if context_blocks else "No relevant context found."
    sources = _sources_from_results(results)

    messages = _build_messages(history, request.query, context_str)

    def event_generator():
        full_answer = ""
        try:
            for token in llm.chat_stream(messages):
                full_answer += token
                payload = json.dumps({"type": "text", "content": token})
                yield f"data: {payload}\n\n"

            source_payload = json.dumps({
                "type": "sources",
                "sources": [
                    {
                        "chunk_id": s.chunk_id,
                        "document_id": s.document_id,
                        "filename": s.filename,
                        "text": s.text,
                        "score": s.score,
                    }
                    for s in sources
                ],
            })
            yield f"data: {source_payload}\n\n"

            db.add(ChatMessage(session_id=session.id, role="user", content=request.query))
            db.add(ChatMessage(
                session_id=session.id,
                role="assistant",
                content=full_answer,
                sources=[s.model_dump() for s in sources],
            ))
            db.commit()

            done_payload = json.dumps({"type": "done", "answer": full_answer, "session_id": session.id})
            yield f"data: {done_payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            error_payload = json.dumps({"type": "error", "error": str(exc)})
            yield f"data: {error_payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return sessions


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current.id,
    ).first()
    if not session:
        raise HTTPException(404, "Chat session not found")
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    return messages
