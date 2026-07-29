import numpy as np
from app.config import settings


class EmbeddingEngine:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER
        self.dim: int | None = None
        self._model = None
        self._client = None

    def _load_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            self.dim = self._model.get_sentence_embedding_dimension()

    def embed(self, texts: str | list[str]) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]
        if self.provider == "openai":
            return self._openai_embed(texts)
        self._load_model()
        vectors = self._model.encode(
            texts, normalize_embeddings=True, convert_to_numpy=True
        )
        return np.asarray(vectors, dtype=np.float32)

    def _openai_embed(self, texts: list[str]) -> np.ndarray:
        import openai
        if self._client is None:
            self._client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = self._client.embeddings.create(
            input=texts,
            model=settings.OPENAI_EMBEDDING_MODEL,
        )
        vectors = [item.embedding for item in response.data]
        arr = np.asarray(vectors, dtype=np.float32)
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        return arr / np.maximum(norms, 1e-12)

    @property
    def dimension(self) -> int:
        if self.dim is None:
            if self.provider == "openai":
                self.dim = 1536
            else:
                self._load_model()
        return self.dim


embedding_engine = EmbeddingEngine()
