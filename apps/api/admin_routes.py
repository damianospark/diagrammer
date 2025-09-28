from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import logging
from auth import require_admin, require_owner
from database import db
from datetime import datetime, timedelta
import json
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """관리자 대시보드 데이터"""
    try:
        # 기본 통계 데이터 (실제로는 DB에서 집계)
        stats = {
            "total_users": 150,
            "active_users": 120,
            "total_diagrams": 1250,
            "total_exports": 890,
            "revenue_this_month": 15000,
            "revenue_last_month": 12000
        }
        
        return {
            "success": True,
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Admin dashboard failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_users(
    page: int = 1,
    limit: int = 20,
    search: str = "",
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """사용자 목록 조회"""
    try:
        # 실제로는 DB에서 조회
        users = [
            {
                "id": "user-001",
                "email": "user@example.com",
                "name": "사용자 1",
                "role": "USER",
                "plan": "free",
                "status": "ACTIVE",
                "created_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-15T10:30:00Z"
            },
            {
                "id": "user-002",
                "email": "pro@example.com",
                "name": "Pro 사용자",
                "role": "USER",
                "plan": "pro",
                "status": "ACTIVE",
                "created_at": "2024-01-02T00:00:00Z",
                "last_login": "2024-01-15T09:15:00Z"
            }
        ]
        
        return {
            "success": True,
            "users": users,
            "total": len(users),
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Users list failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    request: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """사용자 정보 업데이트"""
    try:
        # 실제로는 DB에서 업데이트
        updates = {
            "role": request.get("role"),
            "plan": request.get("plan"),
            "status": request.get("status")
        }
        
        # 필터링 (None 값 제거)
        updates = {k: v for k, v in updates.items() if v is not None}
        
        logger.info(f"User {user_id} updated: {updates}")
        
        return {
            "success": True,
            "message": "User updated successfully",
            "user_id": user_id,
            "updates": updates
        }
        
    except Exception as e:
        logger.error(f"User update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diagrams")
async def get_diagrams(
    page: int = 1,
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """다이어그램 목록 조회"""
    try:
        # 실제로는 DB에서 조회
        diagrams = [
            {
                "id": "diagram-001",
                "engine": "mermaid",
                "prompt": "사용자 로그인 플로우",
                "created_at": "2024-01-01T00:00:00Z",
                "user_id": "user-001"
            },
            {
                "id": "diagram-002",
                "engine": "visjs",
                "prompt": "시스템 아키텍처",
                "created_at": "2024-01-02T00:00:00Z",
                "user_id": "user-002"
            }
        ]
        
        return {
            "success": True,
            "diagrams": diagrams,
            "total": len(diagrams),
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Diagrams list failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/diagrams/{diagram_id}")
async def delete_diagram(
    diagram_id: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """다이어그램 삭제"""
    try:
        # 실제로는 DB에서 삭제
        logger.info(f"Diagram {diagram_id} deleted by admin {current_user['id']}")
        
        return {
            "success": True,
            "message": "Diagram deleted successfully",
            "diagram_id": diagram_id
        }
        
    except Exception as e:
        logger.error(f"Diagram deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exports")
async def get_exports(
    page: int = 1,
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """익스포트 목록 조회"""
    try:
        # 실제로는 DB에서 조회
        exports = [
            {
                "id": "export-001",
                "diagram_id": "diagram-001",
                "format": "png",
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "export-002",
                "diagram_id": "diagram-002",
                "format": "pptx",
                "created_at": "2024-01-02T00:00:00Z"
            }
        ]
        
        return {
            "success": True,
            "exports": exports,
            "total": len(exports),
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Exports list failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/logs")
async def get_system_logs(
    page: int = 1,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(require_owner)
):
    """시스템 로그 조회 (소유자만)"""
    try:
        # 실제로는 로그 파일에서 조회
        logs = [
            {
                "timestamp": "2024-01-15T10:30:00Z",
                "level": "INFO",
                "message": "User login successful",
                "user_id": "user-001"
            },
            {
                "timestamp": "2024-01-15T10:25:00Z",
                "level": "ERROR",
                "message": "Failed to generate diagram",
                "user_id": "user-002"
            }
        ]
        
        return {
            "success": True,
            "logs": logs,
            "total": len(logs),
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"System logs failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/system/cleanup")
async def system_cleanup(
    current_user: Dict[str, Any] = Depends(require_owner)
):
    """시스템 정리 작업 (소유자만)"""
    try:
        # TTL 만료 데이터 정리
        db._cleanup_expired_data()
        
        return {
            "success": True,
            "message": "System cleanup completed",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"System cleanup failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
