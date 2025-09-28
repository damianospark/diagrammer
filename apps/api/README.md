# Diagrammer API

AI 기반 다이어그램 생성 및 편집을 위한 FastAPI 백엔드 서버입니다.

## 기술 스택

- **Python**: 3.12+
- **FastAPI**: 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **uv**: 패키지 관리자

## 설치 및 실행

### 1. uv 설치

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. 의존성 설치

```bash
# 프로젝트 루트에서
npm run install:api

# 또는 직접 실행
cd apps/api
uv sync
```

### 3. 개발 서버 실행

```bash
# 프로젝트 루트에서
npm run dev:api

# 또는 직접 실행
cd apps/api
uv run python main.py
```

## API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 환경 변수

`.env` 파일을 생성하여 다음 환경 변수를 설정하세요:

```bash
# 데이터베이스 설정
DATABASE_URL=postgresql://user:pass@host:5432/diagrammer

# LLM 설정
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# 기타 설정
LOG_LEVEL=INFO
```

## 개발 명령어

```bash
# 의존성 설치
uv sync

# 개발 서버 실행
uv run python main.py

# 의존성 추가
uv add package-name

# 개발 의존성 추가
uv add --dev package-name

# 의존성 제거
uv remove package-name

# uv run으로 가상환경 자동 활성화
uv run python script.py
```

## 프로젝트 구조

```
apps/api/
├── main.py              # FastAPI 앱 진입점
├── routes.py            # API 라우트 정의
├── database.py          # 데이터베이스 연결
├── llm_adapter.py       # LLM 어댑터
├── pyproject.toml       # 프로젝트 설정 및 의존성
├── uv.lock             # 의존성 잠금 파일
├── requirements.txt     # pip 호환성용 (사용하지 않음)
└── README.md           # 이 파일
```

## 배포

### 프로덕션 실행

```bash
# 프로덕션 서버 실행 (uv run으로 가상환경 자동 활성화)
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker 배포

```dockerfile
FROM python:3.12-slim

# uv 설치
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# 의존성 파일 복사
COPY pyproject.toml uv.lock ./

# 의존성 설치
RUN uv sync --frozen --no-dev

# 소스 코드 복사
COPY . .

# 서버 실행
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 문제 해결

### 가상환경 문제

```bash
# 가상환경 재생성
rm -rf .venv
uv sync
```

### 의존성 충돌

```bash
# 의존성 업데이트
uv lock --upgrade
uv sync
```

### 포트 충돌

기본 포트 8000이 사용 중인 경우:

```bash
# 다른 포트로 실행
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
