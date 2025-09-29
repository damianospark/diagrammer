from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import logging
from database import db
from models import Session, Prompt
from auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/sessions")
async def create_session(
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """새 세션 생성"""
    try:
        title = request.get("title", "새 세션")
        
        session = await db.create_session(
            user_id=current_user.id,
            title=title
        )
        
        return {
            "success": True,
            "session": {
                "id": session.id,
                "title": session.title,
                "status": session.status,
                "created_at": session.created_at,
                "updated_at": session.updated_at
            }
        }
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_sessions(current_user = Depends(get_current_active_user)):
    """사용자의 모든 세션 조회"""
    try:
        sessions = await db.get_user_sessions(current_user.id)
        
        return {
            "success": True,
            "sessions": [
                {
                    "id": s.id,
                    "title": s.title,
                    "status": s.status,
                    "created_at": s.created_at,
                    "updated_at": s.updated_at
                }
                for s in sessions
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user = Depends(get_current_active_user)
):
    """세션 조회"""
    try:
        session = await db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "session": {
                "id": session.id,
                "title": session.title,
                "status": session.status,
                "created_at": session.created_at,
                "updated_at": session.updated_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/sessions/{session_id}")
async def update_session(
    session_id: str,
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """세션 업데이트"""
    try:
        session = await db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        title = request.get("title")
        status = request.get("status")
        
        updated_session = await db.update_session(
            session_id=session_id,
            title=title,
            status=status
        )
        
        return {
            "success": True,
            "session": {
                "id": updated_session.id,
                "title": updated_session.title,
                "status": updated_session.status,
                "created_at": updated_session.created_at,
                "updated_at": updated_session.updated_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/prompts")
async def create_prompt(
    session_id: str,
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """새 프롬프트 생성"""
    try:
        session = await db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        content = request.get("content", "")
        llm_provider = request.get("llm_provider")
        llm_params = request.get("llm_params", {})
        
        prompt = await db.create_prompt(
            session_id=session_id,
            content=content,
            llm_provider=llm_provider,
            llm_params=llm_params
        )
        
        return {
            "success": True,
            "prompt": {
                "id": prompt.id,
                "content": prompt.content,
                "llm_provider": prompt.llm_provider,
                "llm_params": prompt.llm_params,
                "created_at": prompt.created_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}/prompts")
async def get_session_prompts(
    session_id: str,
    current_user = Depends(get_current_active_user)
):
    """세션의 모든 프롬프트 조회"""
    try:
        session = await db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        prompts = await db.get_session_prompts(session_id)
        
        return {
            "success": True,
            "prompts": [
                {
                    "id": p.id,
                    "content": p.content,
                    "llm_provider": p.llm_provider,
                    "llm_params": p.llm_params,
                    "created_at": p.created_at
                }
                for p in prompts
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session prompts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
