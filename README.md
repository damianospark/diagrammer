# Diagrammer

AI 기반 다이어그램 생성 및 편집 플랫폼

## 프로젝트 구조

```
apps/
├── web/          # Next.js 프론트엔드
└── api/          # FastAPI 백엔드
```

## 기술 스택

- **프론트엔드**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **백엔드**: FastAPI, Python, JSON 파일 기반 데이터베이스
- **UI**: Radix UI, Tailwind CSS, shadcn/ui
- **국제화**: next-intl (영어/한국어)

## 개발 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- npm

### 설치 및 실행

#### 1. 의존성 설치

프로젝트는 **독립적인 앱 구조**로 구성되어 있으므로 각 앱의 의존성을 별도로 설치해야 합니다:

```bash
# 모든 의존성 한 번에 설치 (권장)
npm run install:all

# 또는 개별 설치
npm run install:web    # 웹 프론트엔드
npm run install:api    # API 백엔드
```

#### 2. 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

#### 3. 개발 서버 실행

**🚀 권장 방법: 각각 별도 터미널에서 실행**

**터미널 1 - 웹 프론트엔드:**
```bash
npm run dev:web
```

**터미널 2 - API 백엔드:**
```bash
npm run dev:api
```

**📚 실행 확인:**
- **웹 프론트엔드**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs

**💡 편의 명령어:**
```bash
npm run dev  # 실행 가이드 표시
```

### 주요 스크립트

```bash
# 개발 서버 (각각 별도 터미널에서)
npm run dev:web     # 웹 프론트엔드
npm run dev:api     # API 백엔드

# 빌드 및 배포
npm run build       # 웹 빌드
npm run start       # 프로덕션 서버

# 코드 품질
npm run lint        # 린트
npm run type-check  # 타입 체크
npm run test        # 테스트

# 의존성 관리
npm run install:all # 전체 설치
npm run install:web # 웹만 설치
npm run install:api # API만 설치

# 정리
npm run clean:all   # 전체 정리
npm run clean:web   # 웹 정리
npm run clean:api   # API 정리

## API 문서

개발 서버 실행 시 다음 주소에서 확인:
- **API 문서**: http://localhost:8000/docs
- **웹 프론트엔드**: http://localhost:3000

## 라이선스

MIT License

{{ ... }}

기여를 환영합니다! PR을 보내기 전에 이슈를 먼저 생성해주세요.
