from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class DocumentOut(BaseModel):
    id: int
    filename: str
    content_type: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Source(BaseModel):
    chunk_id: int
    document_id: int
    filename: str
    text: str
    score: float


class SearchResult(Source):
    pass


class ChatRequest(BaseModel):
    query: str
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    session_id: int
