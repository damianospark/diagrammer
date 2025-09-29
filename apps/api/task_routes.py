from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import logging
from database import db
from models import Task, TaskMessage, TaskVersion
from auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/tasks")
async def create_task(
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """새 태스크 생성"""
    try:
        title = request.get("title", "새 작업")
        
        task = await db.create_task(
            user_id=current_user.id,
            title=title
        )
        
        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "created_at": task.created_at,
                "updated_at": task.updated_at
            }
        }
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks")
async def get_tasks(current_user = Depends(get_current_active_user)):
    """사용자의 모든 태스크 조회"""
    try:
        tasks = await db.get_user_tasks(current_user.id)
        
        return {
            "success": True,
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "status": t.status,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at
                }
                for t in tasks
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}")
async def get_task(
    task_id: str,
    current_user = Depends(get_current_active_user)
):
    """태스크 조회"""
    try:
        task = await db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "created_at": task.created_at,
                "updated_at": task.updated_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """태스크 업데이트"""
    try:
        task = await db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        title = request.get("title")
        status = request.get("status")
        
        updated_task = await db.update_task(
            task_id=task_id,
            title=title,
            status=status
        )
        
        return {
            "success": True,
            "task": {
                "id": updated_task.id,
                "title": updated_task.title,
                "status": updated_task.status,
                "created_at": updated_task.created_at,
                "updated_at": updated_task.updated_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks/{task_id}/messages")
async def create_task_message(
    task_id: str,
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """새 태스크 메시지 생성"""
    try:
        task = await db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        role = request.get("role", "user")
        content = request.get("content", "")
        
        message = await db.create_task_message(
            task_id=task_id,
            role=role,
            content=content
        )
        
        return {
            "success": True,
            "message": {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create task message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}/messages")
async def get_task_messages(
    task_id: str,
    current_user = Depends(get_current_active_user)
):
    """태스크의 모든 메시지 조회"""
    try:
        task = await db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        messages = await db.get_task_messages(task_id)
        
        return {
            "success": True,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at
                }
                for m in messages
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks/{task_id}/versions")
async def create_task_version(
    task_id: str,
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """새 태스크 버전 생성"""
    try:
        task = await db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        code = request.get("code", "")
        engine = request.get("engine", "mermaid")
        root_id = request.get("root_id")
        
        version = await db.create_task_version(
            task_id=task_id,
            code=code,
            engine=engine,
            root_id=root_id
        )
        
        return {
            "success": True,
            "version": {
                "id": version.id,
                "code": version.code,
                "engine": version.engine,
                "root_id": version.root_id,
                "created_at": version.created_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create task version: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}/versions")
async def get_task_versions(
    task_id: str,
    current_user = Depends(get_current_active_user)
):
    """태스크의 모든 버전 조회"""
    try:
        task = await db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        versions = await db.get_task_versions(task_id)
        
        return {
            "success": True,
            "versions": [
                {
                    "id": v.id,
                    "code": v.code,
                    "engine": v.engine,
                    "root_id": v.root_id,
                    "created_at": v.created_at
                }
                for v in versions
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task versions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/task-versions/{version_id}")
async def get_task_version(
    version_id: str,
    current_user = Depends(get_current_active_user)
):
    """태스크 버전 조회"""
    try:
        version = await db.get_task_version(version_id)
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        task = await db.get_task(version.task_id)
        if not task or task.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "version": {
                "id": version.id,
                "task_id": version.task_id,
                "code": version.code,
                "engine": version.engine,
                "root_id": version.root_id,
                "created_at": version.created_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task version: {e}")
        raise HTTPException(status_code=500, detail=str(e))
