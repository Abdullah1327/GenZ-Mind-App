"""
FAISS-based RAG API routes.

Endpoints
---------
POST /api/rag/index          — chunk + embed + store a document in FAISS
POST /api/rag/chat           — semantic search + Groq LLM → answer
DELETE /api/rag/document/{id} — delete FAISS index for a document
GET  /api/rag/status/{id}    — check whether a document is indexed
"""
from __future__ import annotations

import logging
import os
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.services import chunker, embedder, faiss_store

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Pydantic models ─────────────────────────────────────────────────────────

class IndexRequest(BaseModel):
    document_id: str
    content: str          # full extracted text of the document
    file_name: str = ""


class IndexResponse(BaseModel):
    document_id: str
    chunks_created: int
    status: str


class ChatRequest(BaseModel):
    document_id: str
    message: str
    file_name: str = ""
    # Optional: pass full content so we can index on-the-fly if FAISS index missing
    content: Optional[str] = None


class SourceChunk(BaseModel):
    file_name: str
    snippet: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk] = []


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _groq_answer(
    question: str,
    context_chunks: List[str],
    file_name: str,
    groq_key: str,
) -> str:
    """Call Groq LLM to generate a grounded answer from retrieved chunks."""
    import httpx

    context_text = "\n\n".join(
        f"[Excerpt {i + 1}]:\n{chunk}" for i, chunk in enumerate(context_chunks)
    )

    system_prompt = (
        f"You are the GenZ Mind Document Assistant.\n"
        f"Answer the user's question accurately and concisely, strictly based on the "
        f"following retrieved excerpts from the document \"{file_name}\".\n"
        f"Do NOT invent information. If the answer cannot be found in the excerpts, "
        f"say exactly: \"Based on the uploaded document, this information is not mentioned.\"\n"
        f"Be direct and helpful. Use bullet points or numbered lists where appropriate."
    )

    models_to_try = ["openai/gpt-oss-20b", "groq/compound-mini"]

    with httpx.Client(timeout=30) as client:
        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": f"Document Excerpts:\n{context_text}\n\nQuestion: {question}",
                        },
                    ],
                    "temperature": 0.1,
                    "max_tokens": 700,
                }
                resp = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                logger.warning(f"Failed with model {model}: {e}")
                continue

    raise RuntimeError("All Groq models failed to generate completion")



def _extractive_answer(
    question: str,
    context_chunks: List[str],
    file_name: str,
) -> str:
    """Fallback: return the most relevant chunks as a formatted answer."""
    top = context_chunks[:2]
    excerpts = "\n\n".join(f'> "{c.strip()}"' for c in top)
    return (
        f"According to **{file_name}**:\n\n"
        f"{excerpts}\n\n"
        f"*(Groq LLM unavailable — showing raw document excerpts)*"
    )


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/index", response_model=IndexResponse)
async def index_document(req: IndexRequest):
    """
    Chunk the document text, generate embeddings, and store in FAISS.
    Called by the Next.js upload route after text extraction.
    """
    if not req.content or not req.content.strip():
        raise HTTPException(status_code=422, detail="Document content is empty.")

    # 1. Chunk
    chunks = chunker.chunk_text(
        req.content,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    logger.info(f"[{req.document_id}] Created {len(chunks)} chunks")

    # 2. Embed
    embeddings = embedder.embed_texts(
        chunks, model_name=settings.EMBEDDING_MODEL
    )

    # 3. Store in FAISS
    n = faiss_store.upsert_document(req.document_id, chunks, embeddings)

    return IndexResponse(
        document_id=req.document_id,
        chunks_created=n,
        status="indexed",
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(req: ChatRequest):
    """
    Full RAG pipeline:
      1. If no FAISS index exists yet, index the document on-the-fly.
      2. Embed the user question.
      3. FAISS semantic search → top-k chunks.
      4. Groq LLM generates grounded answer (falls back to extractive).
    """
    # --- On-the-fly indexing if index is missing but content supplied ---
    if not faiss_store.index_exists(req.document_id):
        if req.content and req.content.strip():
            logger.info(
                f"[{req.document_id}] No FAISS index found — indexing on-the-fly."
            )
            chunks = chunker.chunk_text(
                req.content,
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
            )
            embs = embedder.embed_texts(chunks, model_name=settings.EMBEDDING_MODEL)
            faiss_store.upsert_document(req.document_id, chunks, embs)
        else:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No FAISS index found for document '{req.document_id}'. "
                    "Please re-upload the document."
                ),
            )

    # --- Embed query ---
    q_emb = embedder.embed_query(req.message, model_name=settings.EMBEDDING_MODEL)

    # --- FAISS search ---
    results = faiss_store.search(
        req.document_id,
        q_emb,
        top_k=settings.MAX_RETRIEVED_CHUNKS,
    )

    if not results:
        return ChatResponse(
            answer=(
                f"I could not find relevant content in **{req.file_name or req.document_id}** "
                f"for your question. Please try rephrasing."
            ),
            sources=[],
        )

    top_chunks = [chunk for chunk, _score in results]
    top_scores = [score for _chunk, score in results]

    # --- Generate answer ---
    groq_key = settings.GROQ_API_KEY
    is_groq_ok = groq_key and not groq_key.startswith("your_") and len(groq_key) > 10

    try:
        if is_groq_ok:
            answer = _groq_answer(
                req.message, top_chunks, req.file_name or req.document_id, groq_key
            )
        else:
            answer = _extractive_answer(
                req.message, top_chunks, req.file_name or req.document_id
            )
    except Exception as e:
        logger.error(f"LLM error: {e}. Falling back to extractive answer.")
        answer = _extractive_answer(
            req.message, top_chunks, req.file_name or req.document_id
        )

    sources = [
        SourceChunk(
            file_name=req.file_name or req.document_id,
            snippet=chunk[:160] + ("..." if len(chunk) > 160 else ""),
            score=round(score, 4),
        )
        for chunk, score in zip(top_chunks[:3], top_scores[:3])
    ]

    return ChatResponse(answer=answer, sources=sources)


@router.get("/status/{document_id}")
async def index_status(document_id: str):
    """Check whether a document has a FAISS index."""
    return {
        "document_id": document_id,
        "indexed": faiss_store.index_exists(document_id),
    }


@router.delete("/document/{document_id}")
async def delete_document(document_id: str):
    """Delete FAISS index files for a document."""
    removed = faiss_store.delete_document(document_id)
    return {
        "status": "success" if removed else "not_found",
        "message": (
            f"Document {document_id} index deleted."
            if removed
            else f"No index found for {document_id}."
        ),
    }
