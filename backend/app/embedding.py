import numpy as np
from app.config import settings


class EmbeddingEngine:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER
        self.dim: int | None = None
        self._model = None

    def _load_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            self.dim = self._model.get_sentence_embedding_dimension()

    def embed(self, texts: str | list[str]) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]
        self._load_model()
        vectors = self._model.encode(
            texts, normalize_embeddings=True, convert_to_numpy=True
        )
        return np.asarray(vectors, dtype=np.float32)

    @property
    def dimension(self) -> int:
        if self.dim is None:
            self._load_model()
        return self.dim


embedding_engine = EmbeddingEngine()
