"""
MongoDB Database Connection
"""

import pymongo
from typing import List, Optional
from datetime import datetime
import logging
import json

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Global connection
_client = None
_db = None


def init_mongodb():
    """Initialize MongoDB connection"""
    global _client, _db
    try:
        if settings.MONGO_URI:
            _client = pymongo.MongoClient(settings.MONGO_URI)
            _db = _client[settings.MONGO_DB_NAME]
            
            # Create TTL index for GDPR compliance (30 days auto-delete)
            _db["chat_history"].create_index("last_activity", expireAfterSeconds=2592000)
            
            logger.info(json.dumps({
                "event": "mongodb_connected",
                "database": settings.MONGO_DB_NAME,
                "timestamp": datetime.now().isoformat()
            }))
        else:
            logger.warning("MONGO_URI not set, running without database")
    except Exception as e:
        logger.error(json.dumps({
            "event": "mongodb_error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }))


def get_db():
    """Get database instance"""
    return _db


def get_chat_collection():
    """Get chat history collection"""
    if _db is not None:
        return _db["chat_history"]
    return None


def get_feedback_collection():
    """Get feedback collection"""
    if _db is not None:
        return _db["feedback"]
    return None


def save_message(user_email: str, role: str, content: str, sources: List[dict] = None, pii_masked: bool = False, pii_entities: List[dict] = None):
    """Save a chat message with optional sources and PII metadata"""
    collection = get_chat_collection()
    if collection is not None:
        try:
            message_data = {
                "role": role,
                "content": content,
                "timestamp": datetime.now(),
                "pii_masked": pii_masked,
                "pii_entities": pii_entities or []
            }
            if sources:
                message_data["sources"] = sources
                
            collection.update_one(
                {"user_email": user_email},
                {
                    "$push": {
                        "messages": message_data
                    },
                    "$set": {"last_activity": datetime.now()}
                },
                upsert=True
            )
        except Exception as e:
            logger.error(f"Save message error: {e}")


def get_chat_history(user_email: str, limit: int = 6):
    """Get last N messages for a user (sliding window)"""
    collection = get_chat_collection()
    if collection is not None:
        try:
            user_data = collection.find_one({"user_email": user_email})
            if user_data and "messages" in user_data:
                return user_data["messages"][-limit:]
        except Exception:
            pass
    return []


def save_feedback(user_email: str, question: str, response: str, rating: str):
    """Save user feedback"""
    collection = get_chat_collection()
    if collection is not None:
        try:
            collection.update_one(
                {"user_email": user_email},
                {
                    "$push": {
                        "feedback": {
                            "question": question,
                            "response": response[:500],
                            "rating": rating,
                            "timestamp": datetime.now()
                        }
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.error(f"Save feedback error: {e}")
