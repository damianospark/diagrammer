# JSON 파일 기반 데이터베이스를 PostgreSQL로 마이그레이션
# 이 파일은 더 이상 사용되지 않습니다. database_pg.py를 사용하세요.

import logging
logger = logging.getLogger(__name__)

# PostgreSQL 데이터베이스로 리다이렉트
from database_pg import db
