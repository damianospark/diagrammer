from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
import logging
from database import db
from models import SearchIndex
from auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/search")
async def search_content(
    q: str = Query(..., description="검색 쿼리"),
    types: Optional[str] = Query(None, description="검색할 엔티티 타입 (comma-separated)"),
    current_user = Depends(get_current_active_user)
):
    """콘텐츠 검색"""
    try:
        entity_types = None
        if types:
            entity_types = [t.strip() for t in types.split(",")]
        
        results = await db.search_content(
            user_id=current_user.id,
            query=q,
            entity_types=entity_types
        )
        
        return {
            "success": True,
            "query": q,
            "total": len(results),
            "results": [
                {
                    "id": r.id,
                    "entity_type": r.entity_type,
                    "entity_id": r.entity_id,
                    "title": r.title,
                    "content": r.content[:200] + "..." if len(r.content) > 200 else r.content,
                    "metadata": r.metadata,
                    "created_at": r.created_at
                }
                for r in results
            ]
        }
    except Exception as e:
        logger.error(f"Failed to search content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search/index")
async def create_search_index(
    request: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """검색 인덱스 생성"""
    try:
        entity_type = request.get("entity_type")
        entity_id = request.get("entity_id")
        title = request.get("title")
        content = request.get("content", "")
        metadata = request.get("metadata", {})
        
        if not entity_type or not entity_id:
            raise HTTPException(status_code=400, detail="entity_type and entity_id are required")
        
        index = await db.create_search_index(
            user_id=current_user.id,
            entity_type=entity_type,
            entity_id=entity_id,
            title=title,
            content=content,
            metadata=metadata
        )
        
        return {
            "success": True,
            "index": {
                "id": index.id,
                "entity_type": index.entity_type,
                "entity_id": index.entity_id,
                "title": index.title,
                "created_at": index.created_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create search index: {e}")
        raise HTTPException(status_code=500, detail=str(e))
