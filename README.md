# Zeee

A production-ready AI search and research assistant. Zeee combines semantic search over your documents with a conversational RAG chat interface, all wrapped in a premium glassmorphism dark UI.

## Architecture

```mermaid
flowchart TB
    subgraph Client
        UI[React + Vite + Tailwind]
    end
    UI -->|HTTP / SSE| API[FastAPI Backend]
    API --> Auth[JWT Auth]
    API --> DB[(PostgreSQL)]
    API --> VS[Vector Store FAISS]
    API --> EE[Sentence Transformers]
    API --> LLM[Ollama LLM]
    subgraph Workers
        Doc[Document Parser]
        Chunk[Chunker]
    end
    API --> Doc --> Chunk --> VS
    VS --> Search[Semantic Search]
    Search --> LLM
    LLM --> API --> UI
```

- **Backend**: FastAPI, SQLAlchemy + PostgreSQL, FAISS, Sentence Transformers, Ollama
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide icons
- **Vector DB**: FAISS (with sentence-transformer embeddings)
- **LLM**: Ollama (default model `llama3.1:8b`)
- **Auth**: JWT (access tokens)
- **File Parsing**: PDF (`pypdf`), DOCX (`python-docx`), TXT
- **Deployment**: Docker Compose (dev + production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus `/metrics`, structured JSON logging, GZip compression

## Features

- User registration / login (JWT)
- PDF, DOCX, TXT upload and chunking
- Semantic search across your documents with glassmorphism result cards
- Conversational RAG chat with citations, source tags, and copy buttons
- Real-time streaming responses from the LLM
- Persistent chat history with session sidebar
- Dark theme with blue / purple / cyan gradients, frosted glass, and micro-interactions
- Responsive layout with custom scrollbars
- Toast notifications and skeleton loaders
- Prometheus metrics and JSON logging for production observability

## Quick Start (Docker Compose)

1. Copy the environment file and set a strong `SECRET_KEY`:

```bash
cp .env.example .env
# Edit .env and set SECRET_KEY
```

2. Build and run (this starts PostgreSQL, the backend, the frontend, and Ollama):

```bash
docker compose up --build
```

3. Pull the default model in the Ollama container:

```bash
docker compose exec ollama ollama pull llama3.1:8b
```

4. Open `http://localhost:3000` and register an account.

## Production Docker Compose

A production-ready compose file adds restart policies, healthchecks, GZip, and exposes the frontend on port `80`:

```bash
cp .env.example .env
# Fill in SECRET_KEY and Postgres credentials
docker compose -f docker-compose.prod.yml up --build -d
```

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
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT access token lifetime |

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login` (OAuth2 form)
- `GET  /api/auth/me`
- `POST /api/documents/upload` (multipart/form-data)
- `GET  /api/documents`
- `GET  /api/search?q=...`
- `POST /api/chat`
- `POST /api/chat/stream` (SSE streaming)
- `GET  /api/chat/sessions`
- `GET  /api/chat/sessions/{id}/messages`
- `GET  /health`
- `GET  /metrics` (Prometheus)

## Testing

### Backend

```bash
cd backend
pytest app/tests -v
```

### Frontend

```bash
cd frontend
npm run lint
npm run test -- --run
npm run build
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
│   │   ├── monitoring.py
│   │   └── routers/
│   ├── app/tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/workflows/ci.yml
└── README.md
```

## Deployment

### Render

Use the included `docker-compose.prod.yml` with Render's Docker Compose blueprint, or deploy the backend and frontend as separate services:

- **Web Service**: `backend/Dockerfile`, command `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Static Site**: `frontend/` build output (`dist/`)
- **Database**: Render managed PostgreSQL
- **LLM**: Render private service running `ollama/ollama` or external Ollama host

### Railway

Create a Railway project and add:

- Backend service from `backend/Dockerfile`
- Frontend static service from `frontend/Dockerfile`
- PostgreSQL from Railway's template
- A private service or external URL for Ollama

Set the environment variables in Railway's dashboard and point `OLLAMA_HOST` to your Ollama service URL.

## Monitoring & Performance

- **Prometheus metrics** are exposed at `/metrics` via `prometheus-fastapi-instrumentator`
- **Structured JSON logging** is enabled with `python-json-logger`
- **GZip compression** middleware reduces response sizes
- **Frontend chunk splitting** in `vite.config.ts` separates vendor, UI, and markdown bundles for faster loads

## License

MIT
