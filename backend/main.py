from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import rag, ai
from app.core.config import settings

app = FastAPI(
    title="GenZ Mind Backend",
    description="FastAPI backend for RAG document processing and AI content generation",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Generation"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "GenZ Mind API is running"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
