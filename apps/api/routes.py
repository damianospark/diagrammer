from fastapi import APIRouter, HTTPException
import os
from pathlib import Path
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from llm_adapter import get_llm_adapter

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

        diagram_id = str(uuid.uuid4())

        # 다이어그램 저장
        diagrams_db[diagram_id] = {
            "id": diagram_id,
            "engine": engine,
            "code": result['code'],
            "render_type": "readonly",
            "prompt": prompt,
            "meta": result.get('metadata', {}),
            "created_at": datetime.now().isoformat()
        }

        logger.info(f"💾 Diagram saved with ID: {diagram_id}")

        return {
            "success": True,
            "diagram_id": diagram_id,
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
    if diagram_id not in diagrams_db:
        raise HTTPException(status_code=404, detail="Diagram not found")

    return diagrams_db[diagram_id]

@router.post("/exports")
async def create_export(request: Dict[str, Any]):
    """익스포트 생성"""
    try:
        diagram_id = request.get("diagram_id")
        format_type = request.get("format", "png")

        if diagram_id not in diagrams_db:
            raise HTTPException(status_code=404, detail="Diagram not found")

        export_id = str(uuid.uuid4())
        exports_db[export_id] = {
            "id": export_id,
            "diagram_id": diagram_id,
            "format": format_type,
            "storage_key": f"{diagram_id}.{format_type}",
            "created_at": datetime.now().isoformat()
        }

        return {
            "success": True,
            "export_id": export_id,
            "storage_key": f"{diagram_id}.{format_type}"
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
    data = shares_db.get(share_id)
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
