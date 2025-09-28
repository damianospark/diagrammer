import asyncio
import base64
import io
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import tempfile
import subprocess
import json
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class ExportService:
    """다이어그램 익스포트 서비스"""
    
    def __init__(self, storage_path: str = "./exports"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
    
    async def export_png(self, diagram_code: str, engine: str = "mermaid") -> Dict[str, Any]:
        """PNG 익스포트 (클라이언트 사이드에서 처리)"""
        # 실제 PNG 생성은 클라이언트에서 html-to-image로 처리
        # 서버에서는 메타데이터만 반환
        return {
            "success": True,
            "format": "png",
            "message": "PNG export handled by client",
            "metadata": {
                "engine": engine,
                "code_length": len(diagram_code)
            }
        }
    
    async def export_svg(self, diagram_code: str, engine: str = "mermaid") -> Dict[str, Any]:
        """SVG 익스포트 (클라이언트 사이드에서 처리)"""
        # 실제 SVG 생성은 클라이언트에서 처리
        return {
            "success": True,
            "format": "svg",
            "message": "SVG export handled by client",
            "metadata": {
                "engine": engine,
                "code_length": len(diagram_code)
            }
        }
    
    async def export_pptx(self, diagram_code: str, engine: str = "mermaid", 
                         title: str = "Diagram") -> Dict[str, Any]:
        """PPTX 익스포트 (서버 사이드에서 처리)"""
        try:
            # 임시 파일 생성
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                export_data = {
                    "diagram_code": diagram_code,
                    "engine": engine,
                    "title": title,
                    "created_at": datetime.now().isoformat()
                }
                json.dump(export_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            # PPTX 생성 스크립트 실행 (python-pptx 사용)
            pptx_file = self.storage_path / f"{uuid.uuid4().hex}.pptx"
            
            # 간단한 PPTX 생성 스크립트
            pptx_script = f"""
import json
from pptx import Presentation
from pptx.util import Inches
from pptx.enum.text import PP_ALIGN

# 데이터 로드
with open('{temp_file}', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 새 프레젠테이션 생성
prs = Presentation()

# 슬라이드 추가
slide_layout = prs.slide_layouts[0]  # 제목 슬라이드
slide = prs.slides.add_slide(slide_layout)

# 제목 설정
title = slide.shapes.title
title.text = data['title']

# 내용 추가
content = slide.placeholders[1]
content.text = f"Engine: {{data['engine']}}\\nCode: {{data['diagram_code'][:200]}}..."

# 저장
prs.save('{pptx_file}')
print('PPTX created successfully')
"""
            
            # 스크립트 실행
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as script_file:
                script_file.write(pptx_script)
                script_path = script_file.name
            
            try:
                result = subprocess.run(
                    ['python', script_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.returncode == 0:
                    return {
                        "success": True,
                        "format": "pptx",
                        "file_path": str(pptx_file),
                        "file_size": pptx_file.stat().st_size if pptx_file.exists() else 0,
                        "metadata": {
                            "engine": engine,
                            "title": title,
                            "code_length": len(diagram_code)
                        }
                    }
                else:
                    logger.error(f"PPTX generation failed: {result.stderr}")
                    return {
                        "success": False,
                        "error": f"PPTX generation failed: {result.stderr}",
                        "format": "pptx"
                    }
            finally:
                # 임시 파일 정리
                Path(temp_file).unlink(missing_ok=True)
                Path(script_path).unlink(missing_ok=True)
                
        except Exception as e:
            logger.error(f"PPTX export error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "format": "pptx"
            }
    
    async def export_gslides(self, diagram_code: str, engine: str = "mermaid",
                           title: str = "Diagram") -> Dict[str, Any]:
        """Google Slides 익스포트 (미구현)"""
        return {
            "success": False,
            "error": "Google Slides export not implemented yet",
            "format": "gslides"
        }
    
    async def get_export_file(self, file_path: str) -> Optional[bytes]:
        """익스포트 파일 다운로드"""
        try:
            file = Path(file_path)
            if file.exists() and file.is_file():
                return file.read_bytes()
            return None
        except Exception as e:
            logger.error(f"File read error: {str(e)}")
            return None

# 전역 익스포트 서비스 인스턴스
export_service = ExportService()
