"""Vector Service - FAISS-based vector storage and retrieval.
Gracefully degrades to keyword search if embedding model is unavailable.
"""
import os
import pickle
from typing import List, Dict, Any, Optional

import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

from config import settings


class VectorService:
    """Service for vector embedding storage and semantic search.
    Falls back to keyword search if embedding model cannot be loaded.
    """

    def __init__(self):
        self.index = None
        self.documents = []
        self.metadata = []
        self.index_path = os.path.join(settings.VECTOR_DB_PATH, "faiss.index")
        self.docs_path = os.path.join(settings.VECTOR_DB_PATH, "documents.pkl")
        self.dimension = 512
        self._embedding_model = None
        self._embedding_available = None  # None=not checked, True/False

        # Load existing index if available
        self._load_index()

    def _check_embedding_available(self) -> bool:
        """Check if embedding model can be loaded (lazy, one-time)."""
        if self._embedding_available is not None:
            return self._embedding_available

        # Disable embeddings entirely for faster startup - use keyword search instead
        self._embedding_available = False
        print("[VectorService] Using keyword-based search (embeddings disabled for faster startup)")
        return False

    def _get_embedding_model(self):
        """Lazy load the embedding model."""
        if not self._check_embedding_available():
            return None
        if self._embedding_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._embedding_model = SentenceTransformer(
                    settings.EMBEDDING_MODEL,
                    local_files_only=True  # Don't try to download
                )
            except Exception as e:
                print(f"[VectorService] Could not load embedding model: {e}")
                self._embedding_available = False
                return None
        return self._embedding_model

    def _get_embeddings(self, texts: List[str]) -> Optional[np.ndarray]:
        """Generate embeddings for a list of texts."""
        model = self._get_embedding_model()
        if model is None:
            return None
        try:
            embeddings = model.encode(texts, normalize_embeddings=True)
            return embeddings.astype(np.float32)
        except Exception as e:
            print(f"[VectorService] Embedding generation failed: {e}")
            return None

    def _load_index(self):
        """Load existing FAISS index and documents from disk."""
        try:
            if os.path.exists(self.docs_path):
                with open(self.docs_path, "rb") as f:
                    data = pickle.load(f)
                    self.documents = data.get("documents", [])
                    self.metadata = data.get("metadata", [])
                if os.path.exists(self.index_path) and FAISS_AVAILABLE:
                    self.index = faiss.read_index(self.index_path)
        except Exception:
            self.index = None
            self.documents = []
            self.metadata = []

    def _save_index(self):
        """Save documents to disk."""
        try:
            os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)
            with open(self.docs_path, "wb") as f:
                pickle.dump({
                    "documents": self.documents,
                    "metadata": self.metadata,
                }, f)
            if self.index is not None and FAISS_AVAILABLE:
                faiss.write_index(self.index, self.index_path)
        except Exception as e:
            print(f"[VectorService] Save failed: {e}")

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks."""
        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
        return chunks

    def add_documents(
        self,
        texts: List[str],
        metadata_list: Optional[List[Dict[str, Any]]] = None,
    ):
        """Add documents to the store."""
        if metadata_list is None:
            metadata_list = [{} for _ in texts]

        all_chunks = []
        all_metadata = []

        for i, text in enumerate(texts):
            chunks = self.chunk_text(text)
            all_chunks.extend(chunks)
            all_metadata.extend([metadata_list[i]] * len(chunks))

        # Try vector embeddings first
        embeddings = self._get_embeddings(all_chunks) if all_chunks else None

        if embeddings is not None and FAISS_AVAILABLE:
            if self.index is None:
                self.index = faiss.IndexFlatIP(embeddings.shape[1])
            self.index.add(embeddings)
        # Always store documents for keyword search fallback

        self.documents.extend(all_chunks)
        self.metadata.extend(all_metadata)
        self._save_index()

    def search(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search for similar documents. Falls back to keyword search."""
        if not self.documents:
            return []

        # Try vector search if available
        if self._check_embedding_available() and self.index is not None and FAISS_AVAILABLE and self.index.ntotal > 0:
            query_embedding = self._get_embeddings([query])
            if query_embedding is not None:
                scores, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))
                results = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx < len(self.documents):
                        results.append({
                            "text": self.documents[idx],
                            "metadata": self.metadata[idx] if idx < len(self.metadata) else {},
                            "score": float(score),
                        })
                return results

        # Fallback: keyword-based search
        return self._keyword_search(query, top_k)

    def _keyword_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Simple keyword-based search."""
        query_terms = set(query.lower().split())
        scored_docs = []

        for i, doc in enumerate(self.documents):
            doc_lower = doc.lower()
            score = sum(1 for term in query_terms if term in doc_lower)
            if score > 0:
                scored_docs.append({
                    "text": doc,
                    "metadata": self.metadata[i] if i < len(self.metadata) else {},
                    "score": score / max(len(query_terms), 1),
                })

        scored_docs.sort(key=lambda x: x["score"], reverse=True)
        return scored_docs[:top_k]

    def clear(self):
        """Clear all documents and reset the index."""
        self.index = None
        self.documents = []
        self.metadata = []
        if os.path.exists(self.index_path):
            try:
                os.remove(self.index_path)
            except OSError:
                pass
        if os.path.exists(self.docs_path):
            try:
                os.remove(self.docs_path)
            except OSError:
                pass

    def get_all_text(self) -> str:
        """Get all stored document text concatenated."""
        return "\n\n".join(self.documents)


# Singleton instance
vector_service = VectorService()
