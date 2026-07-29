# AI Search Engine

A production-ready semantic search and RAG (Retrieval-Augmented Generation) application.

## Architecture

- **Backend**: FastAPI, SQLAlchemy + PostgreSQL, FAISS, Sentence Transformers, Ollama
- **Frontend**: React + TypeScript + Vite
- **Vector DB**: FAISS (with sentence-transformer embeddings)
- **LLM**: Ollama (default model `llama3.1:8b`)
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
- Containerized backend, frontend, PostgreSQL, and Ollama
- Unit tests for backend and frontend

## Quick Start (Docker Compose)

1. Copy the environment file and set a strong `SECRET_KEY`:

```bash
cp .env.example .env
# Edit .env and set SECRET_KEY
```

2. Build and run (this also starts a local Ollama container):

```bash
docker compose up --build
```

3. Pull the default model in the Ollama container:

```bash
docker compose exec ollama ollama pull llama3.1:8b
```

4. Open `http://localhost:3000` and register an account.

## Local Development

You need an Ollama server running locally. Install Ollama, then pull the model:

```bash
ollama pull llama3.1:8b
ollama serve
```

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
| `EMBEDDING_PROVIDER` | `sentence-transformers` | Embedding provider |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Local sentence-transformer model |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `llama3.1:8b` | Ollama chat model |
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
