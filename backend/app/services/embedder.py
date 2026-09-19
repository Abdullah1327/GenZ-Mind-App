"""
Singleton ONNX-accelerated text embedder using FastEmbed.
Loads BAAI/bge-small-en-v1.5 in quantized ONNX format (super fast, low memory, no PyTorch overhead).
"""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import List

import numpy as np

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _load_model():
    """Load (and cache) the ONNX text embedding model."""
    from fastembed import TextEmbedding
    logger.info("Loading FastEmbed ONNX model: BAAI/bge-small-en-v1.5")
    model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    logger.info("FastEmbed model ready")
    return model


def embed_texts(texts: List[str], model_name: str = "BAAI/bge-small-en-v1.5") -> np.ndarray:
    """
    Embed a list of strings using FastEmbed ONNX runtime.
    Returns a float32 numpy array of shape (N, D).
    """
    model = _load_model()
    embeddings = list(model.embed(texts))
    arr = np.array(embeddings, dtype=np.float32)
    # L2 normalize so dot product == cosine similarity in FAISS IndexFlatIP
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return (arr / norms).astype(np.float32)


def embed_query(query: str, model_name: str = "BAAI/bge-small-en-v1.5") -> np.ndarray:
    """
    Embed a single query string.
    Returns a float32 numpy array of shape (1, D).
    """
    return embed_texts([query], model_name)
