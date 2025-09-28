# Diagrammer

AI 기반 다이어그램 생성 및 편집 플랫폼

## 프로젝트 구조

```
apps/
├── web/          # Next.js SaaS 사이트 (마케팅, 가입, 결제, 어드민)
└── api/          # FastAPI 백엔드 (코어 앱)
docs/             # 프로젝트 문서
├── saas.md       # SaaS 사이트 구축 가이드
├── prd.md        # 제품 요구사항 정의서
└── todo.md       # 개발 체크리스트
```

## 기술 스택

### SaaS 사이트 (apps/web)
- **프론트엔드**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS v4, shadcn/ui
- **인증**: Auth.js v5 (OAuth 전용: Google, Facebook, GitHub, Kakao, Naver)
- **데이터베이스**: Prisma + PostgreSQL
- **결제**: Stripe Checkout + Webhooks
- **관리자**: shadcn/ui 기반 Admin 패널

### 코어 앱 (apps/api)
- **백엔드**: FastAPI, Python 3.12+, uv 패키지 관리
- **AI**: Google Gemini API + Mock LLM
- **렌더링**: Mermaid.js, vis.js, Graphviz DOT

## 개발 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.12+
- PostgreSQL 14+
- npm
- uv (Python 패키지 관리자)

#### uv 설치

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# 설치 확인
uv --version
```

### 설치 및 실행

#### 1. 의존성 설치

```bash
# 모든 의존성 한 번에 설치 (권장)
npm run install:all

# 또는 개별 설치
npm run install:web    # SaaS 사이트 (npm)
npm run install:api    # 코어 앱 (uv)
```

#### 2. 환경변수 설정

**SaaS 사이트 (apps/web):**
```bash
cd apps/web
cp env.example .env.local
# .env.local 파일 편집 (데이터베이스, OAuth, Stripe 설정)
```

**코어 앱 (apps/api):**
```bash
cd apps/api
# 기존 환경변수 설정 유지
```

#### 3. 데이터베이스 설정

```bash
cd apps/web
npx prisma generate
npx prisma db push
```

#### 4. 개발 서버 실행

**🚀 권장 방법: 각각 별도 터미널에서 실행**

**터미널 1 - SaaS 사이트:**
```bash
npm run dev:web
```

**터미널 2 - 코어 앱:**
```bash
npm run dev:api
# 또는 직접 실행
cd apps/api
uv run python main.py
```

**📚 실행 확인:**
- **SaaS 사이트**: http://localhost:3000
- **관리자 패널**: http://localhost:3000/admin
- **코어 앱 API**: http://localhost:8000/docs

**💡 편의 명령어:**
```bash
npm run dev  # 실행 가이드 표시
```

### 주요 스크립트

```bash
# 개발 서버 (각각 별도 터미널에서)
npm run dev:web     # SaaS 사이트
npm run dev:api     # 코어 앱

# 빌드 및 배포
npm run build       # SaaS 사이트 빌드
npm run start       # 프로덕션 서버

# 코드 품질
npm run lint        # 린트
npm run type-check  # 타입 체크
npm run test        # 테스트

# 의존성 관리
npm run install:all # 전체 설치
npm run install:web # SaaS 사이트만 설치 (npm)
npm run install:api # 코어 앱만 설치 (uv)

# 정리
npm run clean:all   # 전체 정리
npm run clean:web   # SaaS 사이트 정리 (node_modules, .next)
npm run clean:api   # 코어 앱 정리 (__pycache__, .venv)
```

## 주요 기능

### SaaS 사이트 (apps/web)
- **랜딩 페이지**: Hero, 기능 소개, 데모
- **요금제**: Free, Pro, Team 플랜 비교
- **OAuth 로그인**: Google, Facebook, GitHub, Kakao, Naver
- **결제 시스템**: Stripe Checkout + Webhooks
- **관리자 패널**: 사용자, 조직, 결제, 감사 로그 관리
- **설정 페이지**: 프로필, 보안, 청구 정보

### 코어 앱 (apps/api)
- **AI 다이어그램 생성**: Google Gemini API
- **다중 렌더링 엔진**: Mermaid.js, vis.js, Graphviz DOT
- **PNG/SVG 내보내기**: html-to-image 기반
- **공유 기능**: PIN 기반 보안 공유
- **패키지 관리**: uv (빠른 Python 패키지 관리)

## 문서

- **[SaaS 구축 가이드](docs/saas.md)**: SaaS 사이트 구축 상세 가이드
- **[제품 요구사항](docs/prd.md)**: PRD 및 구현 상태
- **[개발 체크리스트](docs/todo.md)**: 단계별 개발 진행 상황

## API 문서

개발 서버 실행 시 다음 주소에서 확인:
- **코어 앱 API**: http://localhost:8000/docs
- **SaaS 사이트**: http://localhost:3000
- **관리자 패널**: http://localhost:3000/admin

## 문제 해결

### uv 관련 문제

```bash
# uv 재설치
curl -LsSf https://astral.sh/uv/install.sh | sh

# 가상환경 재생성
cd apps/api
rm -rf .venv
uv sync
```

### Python 버전 문제

```bash
# Python 3.12+ 확인
python --version

# uv로 Python 버전 지정
uv python install 3.12
uv sync
```

## 라이선스

MIT License

## 기여하기

기여를 환영합니다! PR을 보내기 전에 이슈를 먼저 생성해주세요.
