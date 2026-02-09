"""
RAG Chat Routes - API Endpoints
"""

import os
import shutil
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
import json
import hashlib

from app.config import get_settings
from app.auth.jwt import get_current_user
from app.db.database import save_message, get_chat_history, save_feedback
from app.rag.pipeline import (
    search_and_respond,
    add_documents_incremental,
    clear_temporary_knowledge,
    get_vector_db
)
from upstash_redis import Redis

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


# --- Redis Client for Metrics ---
redis = Redis(
    url=settings.UPSTASH_REDIS_REST_URL,
    token=settings.UPSTASH_REDIS_REST_TOKEN
)

# --- Pydantic Models (Input Validation) ---

class ChatRequest(BaseModel):
    """Chat request validation"""
    message: str = Field(min_length=1, max_length=2000, description="User message")


class FeedbackRequest(BaseModel):
    """Feedback request validation"""
    question: str = Field(min_length=1, max_length=5000)
    response: str = Field(min_length=1, max_length=10000)
    rating: str = Field(pattern="^(👍|👎)$", description="Thumbs up or down")


class ChatResponse(BaseModel):
    """Chat response model"""
    response: Optional[str] = None
    sources: List[dict] = []
    confidence: float = 0
    latency: float = 0
    pii_masked: bool = False
    pii_entities: List[dict] = []
    masked_question: Optional[str] = None
    active_users: int = 0
    is_cached: bool = False
    error: Optional[str] = None


# --- Endpoints ---

@router.post("/chat", response_model=ChatResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Main chat endpoint with RAG
    - Rate limited
    - Requires authentication
    - Saves to MongoDB
    """
    user_email = current_user["email"]
    question = chat_request.message
    
    # Log request
    logger.info(json.dumps({
        "event": "chat_request",
        "user": user_email,
        "question_length": len(question),
        "timestamp": datetime.now().isoformat()
    }))
    
    # Get chat history for context
    history = get_chat_history(user_email, limit=6)
    
    # --- Redis Caching Logic ---
    cache_key = None
    is_cached = False
    bypass_cache = request.headers.get("X-Bypass-Cache", "").lower() == "true"

    if settings.UPSTASH_REDIS_REST_URL and not bypass_cache:
        try:
            # Create a unique hash for the question (Namespace + Question)
            hash_input = f"core-brain:{question.strip().lower()}"
            cache_key = f"rag_cache:{hashlib.sha256(hash_input.encode()).hexdigest()}"
            
            cached_data = redis.get(cache_key)
            if cached_data:
                logger.info(f"🚀 Cache Hit for: {question[:30]}...")
                # Return cached response immediately
                cached_json = json.loads(cached_data)
                
                # Still track active user count even on cache hit
                try:
                    now = int(datetime.now().timestamp())
                    redis.zadd("active_users_live", {user_email: now})
                    active_count = redis.zcard("active_users_live") or 1
                except:
                    active_count = 1
                
                return ChatResponse(
                    active_users=active_count,
                    is_cached=True,
                    **cached_json
                )
        except Exception as e:
            logger.warning(f"Redis Cache Read Error: {e}")

    # --- Live RAG Pipeline (If not in cache) ---
    # Get RAG response (contains PII analysis)
    result = search_and_respond(question, history, current_user.get("name", "User"), user_id=user_email)
    
    # Save to Cache if result is valid
    if cache_key and result.get("response"):
        try:
            # Save relevant parts to cache (1 hour TTL = 3600s)
            cache_payload = {
                "response": result["response"],
                "sources": result.get("sources", []),
                "confidence": result.get("confidence", 0),
                "latency": result.get("latency", 0),
                "pii_masked": result.get("pii_masked", False),
                "pii_entities": result.get("pii_entities", []),
                "masked_question": result.get("masked_question")
            }
            redis.setex(cache_key, 3600, json.dumps(cache_payload))
            logger.info(f"💾 Cached new response for: {question[:30]}...")
        except Exception as e:
            logger.warning(f"Redis Cache Write Error: {e}")

    # Save user message (with PII metadata)
    save_message(
        user_email, 
        "user", 
        result.get("masked_question") or question, 
        pii_masked=result.get("pii_masked", False),
        pii_entities=result.get("pii_entities", [])
    )
    
    # Save assistant message if successful
    if result.get("response"):
        save_message(
            user_email, 
            "assistant", 
            result["response"], 
            result.get("sources"),
            pii_masked=result.get("pii_masked", False),
            pii_entities=result.get("pii_entities", [])
        )
    
    # Track Active User in Redis (15 min sliding window)
    try:
        now = int(datetime.now().timestamp())
        fifteen_mins_ago = now - (15 * 60)
        redis.zadd("active_users_live", {user_email: now})
        redis.zremrangebyscore("active_users_live", "-inf", fifteen_mins_ago)
        active_count = redis.zcard("active_users_live") or 1
    except Exception as e:
        logger.warning(f"Redis Metrics Error: {e}")
        active_count = 1

    return ChatResponse(active_users=active_count, is_cached=False, **result)


@router.get("/stats/active")
async def get_active_users():
    """Get count of active users in the last 15 mins from Redis"""
    try:
        now = int(datetime.now().timestamp())
        fifteen_mins_ago = now - (15 * 60)
        
        # Cleanup first
        redis.zremrangebyscore("active_users_live", "-inf", fifteen_mins_ago)
        count = redis.zcard("active_users_live")
        return {"active_users": count or 0}
    except Exception as e:
        return {"error": str(e), "active_users": 1}


@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload PDF documents (temporary - user session)
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    temp_dir = os.path.join(backend_dir, "temp_uploads", current_user["email"].replace("@", "_"))
    os.makedirs(temp_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        if not file.filename.endswith('.pdf'):
            continue
        
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        saved_files.append(file_path)
    
    # Add to vector DB incrementally
    if saved_files:
        chunks_added = add_documents_incremental(saved_files)
        
        # CRITICAL: Clean up temp files to prevent Render disk fill
        for file_path in saved_files:
            try:
                os.remove(file_path)
                logger.info(f"🧹 Cleaned up temp file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to clean temp file {file_path}: {e}")
        
        return {
            "message": f"Uploaded {len(saved_files)} files, added {chunks_added} chunks",
            "files": [os.path.basename(f) for f in saved_files]
        }
    
    raise HTTPException(status_code=400, detail="No valid PDF files")


@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit feedback for a response
    """
    save_feedback(
        user_email=current_user["email"],
        question=feedback.question,
        response=feedback.response,
        rating=feedback.rating
    )
    
    logger.info(json.dumps({
        "event": "feedback_received",
        "user": current_user["email"],
        "rating": feedback.rating,
        "timestamp": datetime.now().isoformat()
    }))
    
    return {"message": "Feedback recorded successfully"}


@router.get("/history")
async def get_history(
    current_user: dict = Depends(get_current_user)
):
    """
    Get chat history for current user
    """
    history = get_chat_history(current_user["email"], limit=50)
    return {"messages": history}


@router.delete("/history")
async def clear_history(
    current_user: dict = Depends(get_current_user)
):
    """
    Clear chat history (new session)
    """
    from app.db.database import get_chat_collection
    collection = get_chat_collection()
    
    if collection is not None:
        collection.update_one(
            {"user_email": current_user["email"]},
            {"$set": {"messages": []}}
        )
    
    return {"message": "History cleared"}


@router.get("/stats")
async def get_stats():
    """
    Get visitor stats from Redis
    """
    try:
        count = redis.get("citizen_safety_visits")
        return {"visitors": int(count) if count else 0}
    except Exception:
        pass
    
    return {"visitors": 0}


@router.post("/stats/increment")
async def increment_stats():
    """
    Increment visitor counter
    """
    try:
        redis.incr("citizen_safety_visits")
        return {"message": "Incremented"}
    except Exception:
        pass
    
    return {"message": "Stats offline"}


@router.post("/knowledge-base/rebuild")
async def rebuild_kb(
    force: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Reset or Rebuild the Knowledge Base.
    - force=False (default): Surgical clear of temporary files.
    - force=True: Not supported in Pinecone (requires full migration).
    """
    from app.rag.pipeline import clear_temporary_knowledge
    
    try:
        if force:
            logger.warning("Deep rebuild not supported in Pinecone mode via API.")
            return {"message": "Deep rebuild is disabled. Use migration script for full reset."}
        else:
            # Default: Just remove session-based temporary tags
            clear_temporary_knowledge()
            return {"message": "Temporary files cleared. Core brain is active."}
    except Exception as e:
        logger.error(f"Reset error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge-base/status")
async def kb_status():
    """
    Check knowledge base status
    """
    vector_db = get_vector_db()
    
    if vector_db is None:
        return {
            "status": "not_initialized",
            "message": "Upload documents to initialize"
        }
    
    return {
        "status": "ready",
        "message": "Knowledge base is active"
    }
