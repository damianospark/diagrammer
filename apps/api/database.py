import json
import asyncio
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid
import logging
from dataclasses import dataclass, asdict
from filelock import FileLock
import schedule
import time
import threading

logger = logging.getLogger(__name__)

@dataclass
class Visitor:
    id: str
    anon_id: str
    created_at: str

@dataclass
class Diagram:
    id: str
    visitor_id: Optional[str]
    user_id: Optional[str]
    engine: str  # 'mermaid' or 'visjs'
    code: str
    render_type: str  # 'readonly' or 'reactflow'
    prompt: Optional[str]
    meta: Dict[str, Any]
    ttl_expire_at: Optional[str]
    created_at: str

@dataclass
class Export:
    id: str
    diagram_id: str
    format: str  # 'png', 'pptx', 'gslides'
    storage_key: Optional[str]
    created_at: str

class JSONDatabase:
    def __init__(self, db_path: str = "./data"):
        self.db_path = Path(db_path)
        self.db_path.mkdir(exist_ok=True)
        self.lock = asyncio.Lock()
        self.file_locks: Dict[str, FileLock] = {}

        # 파일 경로 설정
        self.visitors_file = self.db_path / "visitors.json"
        self.diagrams_file = self.db_path / "diagrams.json"
        self.exports_file = self.db_path / "exports.json"

        # 파일이 없으면 초기화
        self._init_files()

        # TTL 스위퍼 시작
        self._start_ttl_sweeper()

    def _init_files(self):
        """파일이 없으면 빈 리스트로 초기화"""
        for file_path in [self.visitors_file, self.diagrams_file, self.exports_file]:
            if not file_path.exists():
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump([], f, ensure_ascii=False, indent=2)

    def _get_file_lock(self, file_path: str) -> FileLock:
        """파일별 락 반환"""
        if file_path not in self.file_locks:
            self.file_locks[file_path] = FileLock(f"{file_path}.lock")
        return self.file_locks[file_path]

    def _read_file(self, file_path: Path) -> List[Dict]:
        """파일 읽기"""
        lock = self._get_file_lock(str(file_path))
        with lock:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                return []

    def _write_file(self, file_path: Path, data: List[Dict]):
        """파일 쓰기"""
        lock = self._get_file_lock(str(file_path))
        with lock:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    async def create_visitor(self, anon_id: str) -> Visitor:
        """새 방문자 생성"""
        visitor = Visitor(
            id=str(uuid.uuid4()),
            anon_id=anon_id,
            created_at=datetime.now().isoformat()
        )

        visitors = self._read_file(self.visitors_file)
        visitors.append(asdict(visitor))
        self._write_file(self.visitors_file, visitors)

        logger.info(f"Created visitor: {visitor.id}")
        return visitor

    async def get_visitor_by_anon_id(self, anon_id: str) -> Optional[Visitor]:
        """익명 ID로 방문자 조회"""
        visitors = self._read_file(self.visitors_file)
        for v in visitors:
            if v['anon_id'] == anon_id:
                return Visitor(**v)
        return None

    async def create_diagram(self, visitor_id: Optional[str] = None,
                           user_id: Optional[str] = None,
                           engine: str = 'mermaid',
                           code: str = '',
                           render_type: str = 'readonly',
                           prompt: Optional[str] = None,
                           meta: Optional[Dict[str, Any]] = None,
                           ttl_hours: Optional[int] = None) -> Diagram:
        """새 다이어그램 생성"""
        now = datetime.now()
        ttl_expire_at = None
        if ttl_hours:
            ttl_expire_at = (now + timedelta(hours=ttl_hours)).isoformat()

        diagram = Diagram(
            id=str(uuid.uuid4()),
            visitor_id=visitor_id,
            user_id=user_id,
            engine=engine,
            code=code,
            render_type=render_type,
            prompt=prompt,
            meta=meta or {},
            ttl_expire_at=ttl_expire_at,
            created_at=now.isoformat()
        )

        diagrams = self._read_file(self.diagrams_file)
        diagrams.append(asdict(diagram))
        self._write_file(self.diagrams_file, diagrams)

        logger.info(f"Created diagram: {diagram.id}")
        return diagram

    async def get_diagram(self, diagram_id: str) -> Optional[Diagram]:
        """다이어그램 조회"""
        diagrams = self._read_file(self.diagrams_file)
        for d in diagrams:
            if d['id'] == diagram_id:
                return Diagram(**d)
        return None

    async def create_export(self, diagram_id: str, format: str = 'png',
                          storage_key: Optional[str] = None) -> Export:
        """새 익스포트 생성"""
        export = Export(
            id=str(uuid.uuid4()),
            diagram_id=diagram_id,
            format=format,
            storage_key=storage_key,
            created_at=datetime.now().isoformat()
        )

        exports = self._read_file(self.exports_file)
        exports.append(asdict(export))
        self._write_file(self.exports_file, exports)

        logger.info(f"Created export: {export.id}")
        return export

    def _cleanup_expired_data(self):
        """만료된 데이터 정리"""
        now = datetime.now()

        # 만료된 다이어그램 삭제
        diagrams = self._read_file(self.diagrams_file)
        active_diagrams = []
        for d in diagrams:
            if d.get('ttl_expire_at'):
                expire_at = datetime.fromisoformat(d['ttl_expire_at'])
                if expire_at > now:
                    active_diagrams.append(d)
            else:
                active_diagrams.append(d)

        if len(active_diagrams) != len(diagrams):
            self._write_file(self.diagrams_file, active_diagrams)
            logger.info(f"Cleaned up {len(diagrams) - len(active_diagrams)} expired diagrams")

    def _start_ttl_sweeper(self):
        """TTL 스위퍼 시작 (백그라운드 스레드)"""
        def run_scheduler():
            schedule.every(1).hour.do(self._cleanup_expired_data)
            while True:
                schedule.run_pending()
                time.sleep(60)  # 1분마다 체크

        sweeper_thread = threading.Thread(target=run_scheduler, daemon=True)
        sweeper_thread.start()
        logger.info("Started TTL sweeper")

# 전역 데이터베이스 인스턴스
db = JSONDatabase()
