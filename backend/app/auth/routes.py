"""
Authentication Routes - Google OAuth
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from starlette.config import Config
from authlib.integrations.starlette_client import OAuth, OAuthError
import logging
import json
from datetime import datetime

from app.config import get_settings
from app.auth.jwt import create_access_token

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

# OAuth Setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


@router.get("/login")
async def login(request: Request):
    """
    Redirect to Google OAuth login page
    """
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def auth_callback(request: Request):
    """
    Handle Google OAuth callback
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Could not get user info")
        
        # Log successful login
        logger.info(json.dumps({
            "event": "user_login",
            "email": user_info.get("email"),
            "timestamp": datetime.now().isoformat()
        }))
        
        # Create JWT token
        access_token = create_access_token(data={
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture")
        })
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        )
        
    except OAuthError as error:
        logger.error(json.dumps({
            "event": "oauth_error",
            "error": str(error),
            "timestamp": datetime.now().isoformat()
        }))
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/me")
async def get_current_user_info(request: Request):
    """
    Get current user info from token (for testing)
    """
    from app.auth.jwt import get_current_user
    user = await get_current_user(request)
    return user


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should clear token)
    """
    return {"message": "Logged out successfully"}
