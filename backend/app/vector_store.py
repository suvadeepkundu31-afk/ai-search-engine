import os
import numpy as np
import faiss
from app.config import settings


class VectorStore:
    def __init__(self, dim: int, index_path: str = settings.FAISS_INDEX_PATH):
        self.index_path = index_path
        self.dim = dim
        os.makedirs(os.path.dirname(index_path) or ".", exist_ok=True)
        self.index = self._load_or_create()

    def _load_or_create(self):
        if os.path.exists(self.index_path):
            return faiss.read_index(self.index_path)
        base = faiss.IndexFlatIP(self.dim)
        return faiss.IndexIDMap2(base)

    def add(self, ids: list[int] | np.ndarray, vectors: np.ndarray):
        ids = np.asarray(ids, dtype=np.int64)
        vectors = np.asarray(vectors, dtype=np.float32)
        if vectors.ndim == 1:
            vectors = vectors.reshape(1, -1)
        self.index.add_with_ids(vectors, ids)
        self.save()

    def search(self, vector: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray]:
        vector = np.asarray(vector, dtype=np.float32).reshape(1, -1)
        distances, ids = self.index.search(vector, k)
        return distances[0], ids[0]

    def delete(self, ids: list[int] | np.ndarray):
        ids = np.asarray(ids, dtype=np.int64)
        selector = faiss.IDSelectorBatch(ids)
        self.index.remove_ids(selector)
        self.save()

    def save(self):
        faiss.write_index(self.index, self.index_path)
