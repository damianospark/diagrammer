from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import logging
from database import db
from models import User, Subscription, Payment
from auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/users/me")
async def get_current_user_profile(current_user = Depends(get_current_active_user)):
    """현재 사용자 프로필 조회"""
    try:
        # Auth에서 반환된 User 객체 사용
        return {
            "success": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name,
                "image": current_user.image,
                "role": current_user.role,
                "plan": current_user.plan,
                "status": current_user.status
            }
        }
    except Exception as e:
        logger.error(f"Failed to get user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/me")
async def update_current_user_profile(
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """현재 사용자 프로필 업데이트"""
    try:
        # DB에서 사용자 정보 조회 및 업데이트
        updated_user = await db.update_user(
            user_id=current_user.id,
            name=request.get("name"),
            image=request.get("image"),
            locale=request.get("locale"),
            currency=request.get("currency")
        )
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "user": {
                "id": updated_user.id,
                "email": updated_user.email,
                "name": updated_user.name,
                "image": updated_user.image,
                "role": updated_user.role,
                "plan": updated_user.plan,
                "status": updated_user.status,
                "locale": updated_user.locale,
                "currency": updated_user.currency
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/me/subscription")
async def get_user_subscription(current_user = Depends(get_current_active_user)):
    """사용자 구독 정보 조회"""
    try:
        subscription = await db.get_user_subscription(current_user.id)
        
        if not subscription:
            return {
                "success": True,
                "subscription": None
            }
        
        return {
            "success": True,
            "subscription": {
                "id": subscription.id,
                "plan": subscription.plan,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "provider": subscription.provider,
                "created_at": subscription.created_at
            }
        }
    except Exception as e:
        logger.error(f"Failed to get user subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/register")
async def register_user(request: Dict[str, Any]):
    """새 사용자 등록 (OAuth 후 호출)"""
    try:
        email = request.get("email")
        name = request.get("name", "")
        image = request.get("image", "")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # 기존 사용자 확인
        existing_user = await db.get_user_by_email(email)
        if existing_user:
            return {
                "success": True,
                "user": {
                    "id": existing_user.id,
                    "email": existing_user.email,
                    "name": existing_user.name,
                    "image": existing_user.image,
                    "role": existing_user.role,
                    "plan": existing_user.plan,
                    "status": existing_user.status
                },
                "created": False
            }
        
        # 새 사용자 생성
        new_user = await db.create_user(
            email=email,
            name=name,
            image=image
        )
        
        return {
            "success": True,
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "name": new_user.name,
                "image": new_user.image,
                "role": new_user.role,
                "plan": new_user.plan,
                "status": new_user.status
            },
            "created": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to register user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/me/usage")
async def get_user_usage(current_user = Depends(get_current_active_user)):
    """사용자 사용량 조회"""
    try:
        # 세션/태스크/다이어그램 수 계산
        sessions = await db.get_user_sessions(current_user.id)
        tasks = await db.get_user_tasks(current_user.id)
        diagrams = await db.get_user_diagrams(current_user.id)
        exports = await db.get_user_exports(current_user.id)
        
        return {
            "success": True,
            "usage": {
                "sessions_count": len(sessions),
                "tasks_count": len(tasks),
                "diagrams_count": len(diagrams),
                "exports_count": len(exports),
                "plan_limits": {
                    "free": {
                        "sessions": 2,
                        "diagrams": 50,
                        "exports": 10
                    },
                    "pro": {
                        "sessions": -1,  # unlimited
                        "diagrams": -1,
                        "exports": -1
                    }
                }
            }
        }
    except Exception as e:
        logger.error(f"Failed to get user usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))
