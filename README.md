# AI Search Engine

A production-ready semantic search and RAG (Retrieval-Augmented Generation) application.

## Architecture

- **Backend**: FastAPI, SQLAlchemy + PostgreSQL, FAISS, Sentence Transformers, OpenAI
- **Frontend**: React + TypeScript + Vite
- **Vector DB**: FAISS (with sentence-transformer embeddings, optional OpenAI embeddings)
- **Auth**: JWT (access tokens)
- **File Parsing**: PDF (`pypdf`), DOCX (`python-docx`), TXT
- **Deployment**: Docker Compose
- **CI/CD**: GitHub Actions

## Features

- User registration / login (JWT)
- PDF, DOCX, TXT upload and chunking
- Semantic search across your documents
- Conversational RAG chat with citations
- Persistent vector index and document metadata
- Containerized backend, frontend, and PostgreSQL
- Unit tests for backend and frontend

## Quick Start (Docker Compose)

1. Copy the environment file and add your OpenAI API key:

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY, SECRET_KEY
```

2. Build and run:

```bash
docker compose up --build
```

3. Open `http://localhost:3000` and register an account.

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
# Create Postgres or use sqlite via DATABASE_URL
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://aise:aise@localhost:5432/aise` | SQLAlchemy DB URL |
| `SECRET_KEY` | `change-me-in-production` | JWT signing key |
| `OPENAI_API_KEY` | - | Required for LLM chat and OpenAI embeddings |
| `EMBEDDING_PROVIDER` | `sentence-transformers` | `sentence-transformers` or `openai` |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Local sentence-transformer model |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | OpenAI chat model |
| `FAISS_INDEX_PATH` | `./data/faiss.index` | Path to persisted FAISS index |
| `UPLOAD_DIR` | `./data/uploads` | Uploaded file storage |
| `CHUNK_SIZE` | `500` | Words per chunk |
| `CHUNK_OVERLAP` | `50` | Overlapping words between chunks |
| `TOP_K` | `5` | Number of chunks retrieved |

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login` (OAuth2 form)
- `GET  /api/auth/me`
- `POST /api/documents/upload` (multipart/form-data)
- `GET  /api/documents`
- `GET  /api/search?q=...`
- `POST /api/chat`

## Testing

### Backend

```bash
cd backend
pytest app/tests -v
```

### Frontend

```bash
cd frontend
npm run test -- --run
```

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── embedding.py
│   │   ├── vector_store.py
│   │   ├── search.py
│   │   ├── documents.py
│   │   ├── llm.py
│   │   └── routers/
│   ├── app/tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## License

MIT
