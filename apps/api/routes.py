from fastapi import APIRouter, HTTPException, Depends
import os
from pathlib import Path
import json
import uuid
import logging
import base64
from datetime import datetime
from typing import Dict, Any, Optional
from llm_adapter import get_llm_adapter
from database import db
from auth import get_current_active_user
from export_service import export_service

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# 간단한 메모리 기반 데이터베이스 (테스트용)
diagrams_db = {}
exports_db = {}
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
SHARE_DB_PATH = DATA_DIR / "shares.json"

def load_shares() -> Dict[str, Any]:
    try:
        if SHARE_DB_PATH.exists():
            with open(SHARE_DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load shares DB: {e}")
    return {}

def save_shares(data: Dict[str, Any]):
    try:
        with open(SHARE_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Failed to save shares DB: {e}")

@router.post("/generate")
async def generate_diagram(request: Dict[str, Any]):
    """프롬프트로부터 다이어그램 코드 생성"""
    try:
        prompt = request.get("prompt", "")
        engine = request.get("engine", "mermaid")
        provider = request.get("provider", "mock")  # 기본값을 mock으로 변경

        # 요청 로깅
        logger.info(f"📝 Diagram generation request received:")
        logger.info(f"   - Provider: {provider}")
        logger.info(f"   - Engine: {engine}")
        logger.info(f"   - Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")

        # LLM 어댑터 가져오기
        adapter = get_llm_adapter(provider)
        logger.info(f"🔧 Using LLM adapter: {type(adapter).__name__}")

        # 다이어그램 코드 생성
        logger.info("🚀 Starting diagram code generation...")
        result = await adapter.generate_diagram_code(prompt, engine)
        logger.info(f"✅ Generation completed. Success: {result.get('success', False)}")

        if not result['success']:
            error_msg = result.get('error', 'Generation failed')
            logger.error(f"❌ Generation failed: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

        logger.info(f"📊 Generated code length: {len(result.get('code', ''))} characters")

        # 다이어그램 저장 (JSON DB 사용)
        diagram = await db.create_diagram(
            engine=engine,
            code=result['code'],
            render_type="readonly",
            prompt=prompt,
            meta=result.get('metadata', {}),
            ttl_hours=24  # 24시간 TTL
        )

        logger.info(f"💾 Diagram saved with ID: {diagram.id}")

        return {
            "success": True,
            "diagram_id": diagram.id,
            "code": result['code'],
            "engine": engine,
            "metadata": result.get('metadata', {})
        }

    except Exception as e:
        logger.error(f"💥 Unexpected error in generate_diagram: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diagrams/{diagram_id}")
async def get_diagram(diagram_id: str):
    """다이어그램 조회"""
    diagram = await db.get_diagram(diagram_id)
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")

    return {
        "id": diagram.id,
        "engine": diagram.engine,
        "code": diagram.code,
        "render_type": diagram.render_type,
        "prompt": diagram.prompt,
        "meta": diagram.meta,
        "created_at": diagram.created_at
    }

@router.post("/exports")
async def create_export(request: Dict[str, Any]):
    """익스포트 생성"""
    try:
        diagram_id = request.get("diagram_id")
        format_type = request.get("format", "png")
        title = request.get("title", "Diagram")

        # 다이어그램 존재 확인
        diagram = await db.get_diagram(diagram_id)
        if not diagram:
            raise HTTPException(status_code=404, detail="Diagram not found")

        # 익스포트 처리
        if format_type == "png":
            result = await export_service.export_png(diagram.code, diagram.engine)
        elif format_type == "svg":
            result = await export_service.export_svg(diagram.code, diagram.engine)
        elif format_type == "pptx":
            result = await export_service.export_pptx(diagram.code, diagram.engine, title)
        elif format_type == "gslides":
            result = await export_service.export_gslides(diagram.code, diagram.engine, title)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format_type}")

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Export failed"))

        # 익스포트 기록 생성
        export = await db.create_export(
            diagram_id=diagram_id,
            format=format_type,
            storage_key=result.get("file_path")
        )

        return {
            "success": True,
            "export_id": export.id,
            "format": format_type,
            "storage_key": result.get("file_path"),
            "metadata": result.get("metadata", {})
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share")
async def create_share(request: Dict[str, Any]):
    """공유 링크 생성: 코드/엔진/제목을 받아 공유 ID와 PIN을 발급"""
    try:
        code = request.get("code")
        engine = request.get("engine", "mermaid")
        title = request.get("title") or "공유된 다이어그램"
        if not code:
            raise HTTPException(status_code=400, detail="code is required")

        share_id = uuid.uuid4().hex[:12]
        # 5자리 영숫자 PIN
        pin_source = uuid.uuid4().hex.upper()
        pin = ''.join([c for c in pin_source if c.isalnum()])[:5]
        payload = {
            "id": share_id,
            "pin": pin,
            "title": title,
            "engine": engine,
            "code": code,
            "created_at": datetime.now().isoformat(),
        }
        shares = load_shares()
        shares[share_id] = payload
        save_shares(shares)
        logger.info(f"🔗 Share created: id={share_id} pin={pin} title={title}")

        return {
            "success": True,
            "id": share_id,
            "pin": pin,
            "title": title,
            "created_at": payload["created_at"],
        }
    except Exception as e:
        logger.error(f"Share creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/share/{share_id}/meta")
async def share_meta(share_id: str):
    """공유 메타 조회(코드 제외)"""
    shares = load_shares()
    data = shares.get(share_id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": data["id"],
        "title": data["title"],
        "engine": data["engine"],
        "created_at": data["created_at"],
    }

@router.post("/share/{share_id}/unlock")
async def share_unlock(share_id: str, request: Dict[str, Any]):
    """PIN 검증 후 코드 반환"""
    shares = load_shares()
    data = shares.get(share_id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    pin = request.get("pin")
    if not pin or str(pin).strip().upper() != data["pin"]:
        raise HTTPException(status_code=403, detail="Invalid PIN")
    return {
        "id": data["id"],
        "title": data["title"],
        "engine": data["engine"],
        "code": data["code"],
        "created_at": data["created_at"],
    }

@router.post("/export/pptx")
async def export_pptx_endpoint(request: Dict[str, Any]):
    """PPTX 내보내기 - 파일 다운로드 또는 클립보드 데이터 반환"""
    try:
        from fastapi.responses import Response
        
        diagram_data = request.get("shapes", [])
        connections = request.get("connections", [])
        format_type = request.get("format", "file")  # "file" 또는 "clipboard"
        
        if format_type == "file":
            # PPTX 파일 생성
            pptx_bytes = await export_service.create_pptx_from_konva(diagram_data, connections)
            return Response(
                content=pptx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                headers={"Content-Disposition": "attachment; filename=diagram.pptx"}
            )
        elif format_type == "clipboard":
            # 클립보드 호환 데이터 생성
            clipboard_data = await export_service.create_clipboard_data_from_konva(diagram_data, connections)
            return {
                "success": True,
                "format": "powerpoint",
                "data": clipboard_data,
                "mime_type": "application/x-mspowerpoint"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid format type")
            
    except Exception as e:
        logger.error(f"PPTX export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exports/{export_id}/download")
async def download_export(export_id: str):
    """익스포트 파일 다운로드"""
    try:
        # 익스포트 기록 조회 (간단한 구현)
        # 실제로는 export_id로 DB에서 조회해야 함
        file_path = f"./exports/{export_id}.pptx"  # 임시 구현
        
        file_data = await export_service.get_export_file(file_path)
        if not file_data:
            raise HTTPException(status_code=404, detail="Export file not found")
        
        return {
            "success": True,
            "file_data": base64.b64encode(file_data).decode('utf-8'),
            "file_size": len(file_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
