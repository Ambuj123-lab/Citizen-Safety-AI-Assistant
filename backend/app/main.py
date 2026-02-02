"""
Citizen Safety & Awareness AI - FastAPI Backend
Author: Ambuj Kumar Tripathi
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import logging
import json
from datetime import datetime

from app.config import get_settings
from app.auth.routes import router as auth_router
from app.rag.routes import router as rag_router
from app.db.database import init_mongodb

# --- Structured Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

# --- Rate Limiter ---
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info(json.dumps({
        "event": "startup",
        "app": settings.APP_NAME,
        "timestamp": datetime.now().isoformat()
    }))
    init_mongodb()
    yield
    # Shutdown
    logger.info(json.dumps({
        "event": "shutdown",
        "timestamp": datetime.now().isoformat()
    }))


# --- FastAPI App ---
app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise-grade RAG chatbot for citizen safety",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # Alternative docs
    lifespan=lifespan
)

# --- Rate Limiting ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS (React frontend ko allow karo) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        settings.FRONTEND_URL,   # Dynamic from .env
        "https://citizen-safety-ai-assistant.vercel.app"  # Your specific Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Session Middleware (Required for OAuth) ---
# For production HTTPS, we need to set cookie security properly
is_production = not settings.DEBUG and "localhost" not in settings.FRONTEND_URL
app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.SECRET_KEY,
    same_site="none" if is_production else "lax",  # Required for cross-site OAuth
    https_only=is_production  # Only HTTPS in production
)


# --- Health Endpoint ---
@app.get("/health")
async def health_check():
    """Health check for monitoring"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "timestamp": datetime.now().isoformat()
    }


# --- Include Routers ---
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(rag_router, prefix="/api", tags=["RAG Chat"])


# --- Root Endpoint ---
@app.get("/")
async def root():
    return {
        "message": "🛡️ Citizen Safety & Awareness AI",
        "developer": "Ambuj Kumar Tripathi",
        "docs": "/docs"
    }
