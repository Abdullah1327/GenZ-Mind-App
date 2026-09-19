"""
Per-document FAISS index store.

Each document gets its own FAISS IndexFlatIP (inner-product / cosine similarity
after L2-normalised embeddings).  Indexes are persisted to disk so they survive
server restarts without re-indexing.

Files on disk (inside FAISS_INDEX_DIR):
  {doc_id}.index   — FAISS binary index
  {doc_id}.pkl     — list of chunk strings (parallel to the FAISS vectors)
"""
from __future__ import annotations

import logging
import os
import pickle
from typing import List, Tuple

import faiss
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

_INDEX_DIR = settings.FAISS_INDEX_DIR


def _index_path(doc_id: str) -> str:
    return os.path.join(_INDEX_DIR, f"{doc_id}.index")


def _chunks_path(doc_id: str) -> str:
    return os.path.join(_INDEX_DIR, f"{doc_id}.pkl")


def index_exists(doc_id: str) -> bool:
    return os.path.exists(_index_path(doc_id)) and os.path.exists(_chunks_path(doc_id))


def upsert_document(doc_id: str, chunks: List[str], embeddings: np.ndarray) -> int:
    """
    Build (or overwrite) a FAISS index for *doc_id*.

    Parameters
    ----------
    doc_id     : unique document identifier (used as filename stem)
    chunks     : list of text strings (one per embedding vector)
    embeddings : float32 numpy array of shape (N, D), L2-normalised

    Returns
    -------
    Number of vectors stored.
    """
    dim = embeddings.shape[1]

    # IndexFlatIP = exact inner-product search (== cosine sim for L2-normed vecs)
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    # Persist
    faiss.write_index(index, _index_path(doc_id))
    with open(_chunks_path(doc_id), "wb") as f:
        pickle.dump(chunks, f)

    logger.info(f"FAISS index for '{doc_id}' saved — {len(chunks)} chunks, dim={dim}")
    return len(chunks)


def search(
    doc_id: str,
    query_embedding: np.ndarray,
    top_k: int = 5,
) -> List[Tuple[str, float]]:
    """
    Search the FAISS index for *doc_id*.

    Returns a list of (chunk_text, similarity_score) tuples,
    sorted by descending similarity.

    Falls back to empty list if the index doesn't exist.
    """
    if not index_exists(doc_id):
        logger.warning(f"No FAISS index found for '{doc_id}'")
        return []

    index = faiss.read_index(_index_path(doc_id))
    with open(_chunks_path(doc_id), "rb") as f:
        chunks: List[str] = pickle.load(f)

    k = min(top_k, len(chunks))
    distances, indices = index.search(query_embedding, k)

    results: List[Tuple[str, float]] = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx >= 0:  # FAISS returns -1 for empty slots
            results.append((chunks[idx], float(dist)))

    return results  # already sorted by FAISS (highest similarity first)


def delete_document(doc_id: str) -> bool:
    """Remove FAISS index files for *doc_id*. Returns True if files existed."""
    removed = False
    for path in [_index_path(doc_id), _chunks_path(doc_id)]:
        if os.path.exists(path):
            os.remove(path)
            removed = True
    if removed:
        logger.info(f"FAISS index for '{doc_id}' deleted")
    return removed
