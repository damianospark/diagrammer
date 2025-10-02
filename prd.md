
# Diagrammer PRD

## 0) 한눈 요약

* **비회원(게스트)**: LLM → Mermaid/vis.js 리드온리, PNG Export
* **무료 회원**: Mermaid/vis.js → React Flow 변환 편집, 세션 2개 저장, PNG/PPTX
* **유료 회원**: 무제한 세션/검색/공유(뷰), Google Slides Export
* **관리자(Admin)**: 회원/세션/결제/콘텐츠/캐시/SEO/보안 관리 (FastAPI Admin)

**백엔드 아키텍처**
* **FastAPI 서버**: RESTful API, JWT 인증, 역할 기반 접근 제어
* **JSON 파일 DB**: 방문자/다이어그램/익스포트/공유 링크 관리
* **LLM 어댑터**: Mock/Gemini API 지원, Mermaid/vis.js 코드 생성
* **익스포트 서비스**: PNG/SVG/PPTX 지원, 파일 다운로드
* **Stripe 결제**: 체크아웃, 포털, 웹훅 처리
* **관리자 API**: 대시보드, 사용자/콘텐츠 관리, 시스템 로그

렌더링/편집 엔진 규칙

* **Mermaid.js**: 플로우/시퀀스/단순 구조(<100 노드)
* **vis.js**: 네트워크/계층/대규모(>100), 500+ 노드 성능 안전장치
* **회원 편집**: Mermaid/vis.js → **React Flow 객체** 변환 후 편집

**SaaS 사이트 구조**
* **랜딩 페이지**: Hero, 기능 소개, 데모, CTA
* **요금제 페이지**: 플랜 비교, FAQ, Stripe Checkout
* **로그인**: OAuth 전용 (Google, Facebook, GitHub, Kakao, Naver)
* **메인 앱**: 다이어그램 생성/편집 도구
* **설정**: 프로필, 보안, 청구정보
* **관리자**: 사용자/콘텐츠/시스템 관리

---

## 12a) 공유/워크스페이스 UX 고도화(2025-09-28)

### 변경 요약
- 워크스페이스 리비전과 메시지를 태스크 단위로 영속화하여 새로고침 후에도 유지
- 코드 드래프트 적용 시 동일 루트의 대표 버블이 최신 리비전을 가리키도록 매핑 보강
- 질문 버블 삭제 UX 안정화: 팝오버 도망 현상 방지 및 질문-답변 블록 동시 삭제

### 상세 내용
- 영속화 키(로컬 스토리지)
  - `workspace.versions.{taskId}`: 해당 태스크의 전체 코드 리비전 배열
  - `workspace.messages.{taskId}`: 해당 태스크의 채팅 타임라인(질문/답변) 배열
  - 기존 전역 키(`workspace.versions`, `workspace.messages`)도 유지하되, 현재 태스크가 있을 경우 태스크 단위 키를 우선 사용
- 로드/저장 흐름
  - `Workspace.tsx`의 `loadTask()`가 `{taskId}`별 저장본을 우선 복원
  - 메시지/리비전 변경 시 `saveTaskMessages()`에서 태스크 리스트 갱신과 함께 `{taskId}`별 전체 스냅샷을 저장
- 드래프트 적용(`applyDraft`)
  - 적용 버전의 `rootId` 기준으로 타임라인 내 같은 루트의 대표 코드 버블 1개를 찾아 최신 리비전 ID로 교체
  - 적용 후 `selectedVersionId`, `openRootId`, `openRevisionByRoot[rootId]`를 최신으로 동기화
  - 루트별 적용 리비전은 최대 5개만 유지(`pruneRevisions`)
- 삭제 팝오버/동작
  - 질문 버블 액션바에 고정 상태(`actionBarFor`)와 삭제 팝오버 제어 상태(`openDeleteFor`)를 도입해, 마우스가 팝오버로 이동해도 닫히지 않도록 처리
  - 삭제 시 해당 사용자 질문과 그 뒤의 첫 번째 어시스턴트 코드 버블을 함께 제거

### 파일
- 프론트: `apps/web/components/workspace/Workspace.tsx`

### 접근성/UX
- 삭제 확인 팝오버에 명확한 포커스/호버 유지, 키보드 내비 지원(버튼 focusable)
- 코드 리비전 적용 시 즉시 캔버스 반영 및 토스트 안내

## 12b) SaaS 사이트 및 UI/UX 개선(2025-01-15)

### 변경 요약
- SaaS 마케팅 사이트 구축 및 기존 앱과 통합
- 헤더 네비게이션 및 사이드바 UX 개선
- 캔버스 액션 버튼 스타일 통일 및 조건부 활성화

### 상세 내용
- SaaS 사이트 구조
  - `/`: 랜딩 페이지 (Hero, 기능, 데모, 고객 로고, CTA)
  - `/pricing`: 요금제/기능 비교/FAQ, Checkout 버튼
  - `/login`: OAuth 전용 로그인 (이메일 인증 없음)
  - `/app`: 메인 애플리케이션 (기존 다이어그램 생성 도구)
  - `/settings`: 프로필, 보안, 청구정보
  - `/admin`: 관리자 패널 (shadcn/ui 기반)
- 인증 시스템
  - FastAPI 백엔드 기반 JWT 인증
  - OAuth 제공자: Google, Facebook, GitHub, Kakao, Naver
  - 이메일 인증 제거, OAuth 전용
- 결제/구독 시스템
  - Stripe Checkout 세션 생성
  - Webhook 처리: checkout.session.completed, customer.subscription.updated
  - BillingProfile과 User 동기화
  - 플랜별 엔타이틀 관리
- UI/UX 개선
  - 글로벌 헤더: 테마/언어 토글, 사용자 메뉴 통합
  - 사이드바: 토글 핸들 외곽 이동, 호버 확장, 폭 조절 기능
  - 캔버스 헤더: 액션 버튼 스타일 통일, 차트 존재 시에만 활성화
  - 반응형 디자인 및 접근성 개선

### 파일
- SaaS 사이트: `apps/web/app/` (홈, 요금제, 로그인, 설정, 관리자)
- 글로벌 헤더: `apps/web/components/GlobalHeader.tsx`
- 사이드바: `apps/web/components/side-nav/SideNavClient.tsx`
- 워크스페이스: `apps/web/components/workspace/Workspace.tsx`
- CSS 스타일: `apps/web/app/globals.css`

### 접근성/UX
- 헤더 메뉴 활성 상태 표시 (파란색 텍스트 + 하단 보더)
- 사이드바 호버 시 자동 확장 및 텍스트 표시
- 캔버스 버튼 색상 체계 통일 (PNG: 코랄, SVG: 앰버, 복사: 라임, 코드: 파랑, 공유: 보라)
- 키보드 네비게이션 및 스크린 리더 지원

## 12c) 백엔드 FastAPI 시스템 구축(2025-01-15)

### 변경 요약
- FastAPI 기반 백엔드 서버 구축
- JSON 파일 기반 데이터베이스 시스템
- JWT 인증 및 역할 기반 접근 제어
- LLM 어댑터 시스템 (Mock/Gemini)
- 익스포트 서비스 (PNG/SVG/PPTX)
- Stripe 결제 시스템 통합
- 관리자 패널 API

### 상세 내용
- **FastAPI 서버 구조**
  - `apps/api/main.py`: 메인 애플리케이션 및 CORS 설정
  - `apps/api/routes.py`: 코어 API 엔드포인트
  - `apps/api/auth_routes.py`: 인증 관련 API
  - `apps/api/stripe_routes.py`: Stripe 결제 API
  - `apps/api/admin_routes.py`: 관리자 패널 API
- **인증 시스템**
  - JWT 기반 인증 (30일 토큰)
  - 테스트 모드 사용자: user@test.com, pro@test.com, admin@test.com, owner@test.com
  - 역할 기반 접근 제어: USER, ADMIN, OWNER
  - 인증 미들웨어 및 의존성 주입
- **JSON 파일 데이터베이스**
  - `visitors.json`: 방문자 관리
  - `diagrams.json`: 다이어그램 저장/조회
  - `exports.json`: 익스포트 기록
  - `shares.json`: 공유 링크 관리
  - 파일 락킹 및 TTL 스위퍼 (1시간마다 만료 데이터 정리)
- **LLM 어댑터 시스템**
  - Mock LLM 어댑터 (개발용)
  - Gemini API 어댑터 (실제 LLM)
  - Mermaid/vis.js 코드 생성
  - 에러 처리 및 폴백 메커니즘
- **익스포트 서비스**
  - PNG/SVG 익스포트 (클라이언트 사이드 처리)
  - PPTX 익스포트 (서버 사이드, python-pptx)
  - Google Slides 익스포트 (스텁)
  - 파일 다운로드 API
- **Stripe 결제 시스템**
  - 체크아웃 세션 생성
  - 고객 포털 세션
  - 웹훅 처리: checkout.session.completed, subscription.updated/deleted
  - 구독 상태 관리
- **관리자 패널 API**
  - 대시보드 통계 (사용자/다이어그램/익스포트/수익)
  - 사용자 관리 (조회, 수정)
  - 다이어그램 관리 (조회, 삭제)
  - 익스포트 관리
  - 시스템 로그 (OWNER 전용)
  - 시스템 정리 작업 (OWNER 전용)
- **공유 시스템**
  - PIN 기반 보안 공유 (5자리 영숫자)
  - 공유 링크 생성/조회
  - PIN 검증 및 코드 반환

### API 엔드포인트
- **인증** (`/api/auth`): 로그인, 사용자 정보, 토큰 검증
- **코어** (`/api/v1`): 다이어그램 생성/조회, 익스포트, 공유
- **Stripe** (`/api/stripe`): 체크아웃, 포털, 웹훅
- **관리자** (`/api/admin`): 대시보드, 사용자/콘텐츠 관리, 시스템 로그

### 파일
- 백엔드 서버: `apps/api/`
- 데이터베이스: `apps/api/database.py`
- 인증: `apps/api/auth.py`
- LLM 어댑터: `apps/api/llm_adapter.py`
- 익스포트 서비스: `apps/api/export_service.py`
- Stripe 서비스: `apps/api/stripe_service.py`

### 보안/운영
- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (USER/ADMIN/OWNER)
- CORS 설정 및 보안 헤더
- 구조적 로깅 및 에러 핸들링
- TTL 기반 데이터 정리
- 파일 락킹으로 동시 접근 제어

## 12d) 테스트 모드 및 개발 환경(2025-01-15)

### 변경 요약
- 개발 및 테스트를 위한 테스트 모드 사용자 시스템
- FastAPI 백엔드와 Next.js 프론트엔드 연동
- 환경변수 기반 설정 관리

### 상세 내용
- **테스트 모드 사용자**
  - `user@test.com`: 일반 사용자 (free 플랜)
  - `pro@test.com`: Pro 사용자 (pro 플랜)
  - `admin@test.com`: 관리자 (ADMIN 역할)
  - `owner@test.com`: 소유자 (OWNER 역할)
- **개발 환경 설정**
  - FastAPI 서버: `http://localhost:8000`
  - Next.js 프론트엔드: `http://localhost:3000`
  - CORS 설정으로 로컬 개발 지원
- **환경변수 관리**
  - `.env.local`: 프론트엔드 환경변수
  - `.env`: 백엔드 환경변수
  - API 키, 데이터베이스 URL, Stripe 설정 등
- **개발 도구**
  - FastAPI 자동 문서화 (`/docs`)
  - 구조적 로깅 및 에러 핸들링
  - 파일 기반 데이터베이스로 빠른 개발/테스트

### 파일
- 환경설정: `apps/web/.env.local`, `apps/api/.env`
- 테스트 사용자: `apps/api/auth.py` (TEST_USERS)
- 개발 서버: `apps/api/main.py`, `apps/web/package.json`

### 개발 워크플로우
1. 백엔드 서버 시작: `cd apps/api && python3 -m uvicorn main:app --reload`
2. 프론트엔드 서버 시작: `cd apps/web && npm run dev`
3. 테스트 사용자로 로그인하여 기능 테스트
4. API 문서 확인: `http://localhost:8000/docs`

## 9) 프론트엔드 UX 업데이트(2025-09-26)

### 개요
- 답변 버블 내 코드 리비전을 ‘동그란 점(최대 5개)’으로 표현하고, 클릭한 리비전만 펼쳐서 캔버스에 즉시 렌더.
- 채팅/캔버스는 세로 풀-높이. 좌우 비율은 스플리터로 조절(기본 30/70)하며, 설정 화면에서 슬라이더로 변경 가능(LocalStorage 연동).
- 오류/예외는 안내형 버블로만 노출(캔버스 렌더 미트리거).

### 상세
- 리비전 관리
  - 루트별 최신 5개 리비전 보관. 초과 시 자동 정리(prune).
  - 오래된 리비전일수록 흐릿하게, 최신은 진하게 표현. 활성 리비전에는 링 표시.
  - 클릭 시 해당 리비전만 펼치고 캔버스 즉시 렌더.

- 레이아웃/조작
  - 좌측 채팅, 우측 캔버스가 h-full.
  - 가운데 수평 스플리터로 20~80% 범위에서 비율 조절.
  - 설정 화면에서 슬라이더로 비율 변경 가능(키: `workspace.splitPct`), 워크스페이스는 storage/커스텀 이벤트로 실시간 반영.

- 버튼/툴팁
  - 캔버스 헤더: PNG, SVG, 이미지 복사, 코드 저장 버튼을 같은 줄에 배치하고, 제목 변경/삭제는 개별 아이콘 버튼으로만 노출(드롭다운 제거).
  - 모든 아이콘 버튼에 툴팁(title/aria-label) 제공.
  - 답변 버블 상단 액션은 편집/복사만 유지.

- 상태 표시
  - 렌더 성공: 초록 테두리, 실패: 빨간 테두리. 히스토리/루트 표시는 제거.

### 비고(기술)
- 프론트: `apps/web/components/workspace/Workspace.tsx`
- 설정: `apps/web/app/settings/page.tsx` (split 비율 설정 + 이벤트 반영)
- 백엔드: `apps/api/llm_adapter.py`(Gemini 후보 모델 폴백 → Mock 폴백, 코드 유효성 휴리스틱)

## 10) 사이드 네비게이션 업데이트(2025-09-26)

### 개요
- Notion 스타일의 왼쪽 고정 사이드 네비게이션을 도입. 화면 전체 높이(h-screen), 상단 로고/이름, 중앙 메뉴, 하단 프로필 구성.
- 데스크톱: 접기/펼치기 토글(지속성 localStorage: `sidebar.collapsed`).
- 모바일: shadcn/ui `Sheet`로 햄버거 버튼 토글.

### 상세
- 파일 구조
  - 서버: `apps/web/components/side-nav/SideNav.tsx`
  - 클라이언트: `apps/web/components/side-nav/SideNavClient.tsx`
  - 레이아웃 통합: `apps/web/app/layout.tsx` 내 `<SideNav />` 적용
  - 모바일 Sheet: `apps/web/components/ui/sheet.tsx`

- 네비게이션/접근성
  - Hover: `hover:bg-[var(--bg-e2)]`
  - Active: `font-semibold + border-l-2 border-[var(--color-primary)] + subtle glow`
  - 키보드 내비: Tab/Enter/Space, `aria-current="page"`, `focus-visible:ring-2`(accent)
  - 접힘 상태: 아이콘만 표시, 라벨은 `sr-only`, 툴팁 대체(브라우저 기본 title) 가능

- 디자인 토큰
  - Tailwind v4 `@theme` 변수 사용: Electric Violet(`--color-primary`), Cyan Azure(`--color-accent`), `--bg-e2`, `--radius`

## 11) Tasks 및 검색 패널(2025-09-26)

### 개요
- 사이드바 메뉴 `Projects` → `Tasks`로 개편. Dashboard 바로 아래에 `New Task`, `Search` 추가.
- `New Task` 클릭 시 새로운 작업이 생성되고 현재 세션이 초기화되며, 작업 목록에 `새작업 N`으로 추가.
- `Search`는 사이드바 오른쪽에 슬라이딩 패널로 표시되며, 모든 작업의 타이틀과 채팅(사용자/어시스턴트) 내용을 대상으로 검색.

### 동작/데이터
- 로컬 스토리지 키
  - `tasks.list`: 작업 배열 `[{ id, title, createdAt, messages }]`
    - messages: `{ role: 'user'|'assistant', content: string }[]`
  - `tasks.currentId`: 현재 선택된 작업 ID
  - `tasks.next`: 새 작업 넘버링 시퀀스
- 이벤트
  - 생성: `window.dispatchEvent(new CustomEvent('tasks:new', { detail: { id } }))`
  - 선택: `window.dispatchEvent(new CustomEvent('tasks:select', { detail: { id } }))`
  - 갱신 브로드캐스트(동일 탭): `window.dispatchEvent(new CustomEvent('tasks:updated'))`

### 구현
- 사이드바(클라이언트): `apps/web/components/side-nav/SideNavClient.tsx`
  - Tasks 리스트 렌더링, `New Task` 생성, `Search` 패널 토글
  - 각 태스크 항목에 드롭다운 액션(이름 바꾸기, 삭제)을 제공하며, 이름 바꾸기는 인라인 입력으로 즉시 수정 가능
  - `tasks:updated` 이벤트 구독으로 동일 탭에서 리스트 즉시 반영
  - 현재 선택된 작업 강조(하이라이트) 및 `/tasks/{id}` 경로에서 상위 `Tasks` 메뉴 활성화 유지
- 워크스페이스: `apps/web/components/workspace/Workspace.tsx`
  - `tasks:new` 수신 시 세션 초기화(메시지/버전/선택 상태)
  - `tasks:select` 수신 시 해당 작업의 messages 로드 → 메시지/버전 간략 재구성 후 타임라인에 반영
  - 메시지 변경 시 `tasks.list`에 간소화된 메시지 스냅샷 저장
  - 작업 제목 인라인 변경(편집/저장/취소) 및 `tasks.list`에 즉시 반영
  - 캔버스 헤더: 타이틀과 액션 버튼을 한 줄 정렬, 본문 영역을 게스트/회원 모드에 맞게 분기(버튼: PNG/SVG/복사/코드/공유)
  - 캔버스 뷰어(게스트 우선 구현): `react-zoom-pan-pinch` 기반 팬/줌, 그리드 배경, PNG/SVG 단일 이미지 감싸기
  - 타임라인: 차트 코드 버블 폭 고정(640px), 버전 점 선택 UI로 교체
- 라우트 스텁: `apps/web/app/tasks/page.tsx` (404 방지 및 가이드)

### 접근성/디자인
- `aria-current="page"` 적용, `focus-visible` 링, 키보드 내비 지원
- 패널: `role="dialog"`/`aria-label="Search"`, 사이드바 폭에 맞춰 좌측 오프셋 적용(접힘 64px/펼침 256px)

## 12) 공유 기능(2025-09-26)

### 개요
- 캔버스 상단 우측에 "공유" 버튼 추가. 현재 선택된 캔버스 코드를 서버에 공유 등록하고, PIN(영숫자 5자리)과 공유 URL(`/s/{id}`)을 발급받음.
- 사이드바 하단에 "공유된 페이지" 섹션을 추가해 로컬에 저장된 공유 링크를 리스트업.
- 공유 페이지는 PIN을 입력해야 열람 가능하며, 우측 상단에 PIN 상태과 공유 URL을 노출.

### 백엔드(API)
- 경로(prefix: `/api/v1`)
  - `POST /share`: 본문 `{ code, engine, title }` → 응답 `{ id, pin, title, created_at }`
  - `GET /share/{id}/meta`: 공유 메타 조회(코드 제외)
  - `POST /share/{id}/unlock`: 본문 `{ pin }` → 검증 후 `{ id, title, engine, code }` 반환
- 영속화: `apps/api/data/shares.json`에 JSON 저장(load/save)

### 프론트엔드
- 워크스페이스: `apps/web/components/workspace/Workspace.tsx`
  - 공유 버튼 클릭 시 `/api/v1/share` 호출 → 로컬 `shared.list`에 `{ id, pin, title, url, createdAt }` 추가, `shared:updated` 이벤트 브로드캐스트
- 공유 페이지: `apps/web/app/s/[id]/page.tsx`
  - 최초 메타 조회 후 PIN 입력 화면 → `unlock` 성공 시 다이어그램 렌더(읽기 전용)
- 사이드바: `apps/web/components/side-nav/SideNavClient.tsx`
  - "공유된 페이지" 섹션에 로컬 저장된 공유 링크 리스트업(같은 탭 업데이트 반영)

### 접근성/보안
- 공유 페이지: PIN 검증 실패 시 403 처리 및 에러 메시지 표시
- 버튼/입력에 적절한 `aria-label`과 포커스 링 적용

## 13) 대시보드 개편(2025-09-26)

### 개요
- 홈(`/`)을 대시보드 화면으로 변경. 작업/다이어그램/공유 통계를 한 눈에 표시.
- 각 Task는 전용 세션 페이지(`/tasks/{id}`)에서 관리되며, 대시보드에서는 채팅 세션을 표시하지 않음.

### 화면 요소
- KPI 카드: 총 작업수, 총 다이어그램수, 공유된 페이지수
- 차트(Recharts): 주제별 다이어그램수(BarChart), 일별 다이어그램수(LineChart)
- 작업별 다이어그램수(최근 10개 작업 BarChart)

### 라우팅/구성
- `/` → `Dashboard` 렌더(`apps/web/components/dashboard/Dashboard.tsx`)
- `/tasks/[id]` → `Workspace` 렌더 + 해당 작업 세션 선택 및 로드
- 사이드바에서 New Task/Task 클릭/검색 결과 클릭 시 `/tasks/{id}`로 이동

### 구현 세부사항
- `Dashboard.tsx`: Recharts(`BarChart`, `LineChart`, `ResponsiveContainer`) 기반으로 데이터 시각화, 로컬 저장소에서 통계 로드
- 데이터 없음 시 빈 상태 메시지 표시, 축/툴팁 스타일 Tailwind 토큰과 일치

## 14) 캔버스 아키텍처 재정립(2025-09-27)

### 전략 요약
- **게스트 뷰(리드온리)**: `react-zoom-pan-pinch`로 PNG/SVG 단일 이미지를 감싸 팬/줌 제공. `html-to-image` 기반 PNG 캡처, 필요 시 백엔드 SVG 생성 대응.
- **회원 편집/저장**: `React Flow(=XYFlow)`를 유일한 편집 엔진으로 채택. Mermaid/vis.js 코드는 입력 포맷으로만 사용하고 변환 후 RF JSON으로 저장/편집.
- **대규모 그래프 (>500 노드)**: `vis-network` 전용 리드온리 뷰어. 편집 요청 시 클러스터링/샘플링 후 RF로 다운사이즈 변환.
- **내보내기**: RF JSON을 단일 소스로 삼아 이미지 복사/PNG(클라이언트), PPTX(`python-pptx`), Google Slides(Slides API)로 변환. "Copy as" UX로 Image/PPTX/Slides 3옵션 제공.

### 렌더 파이프라인
- 게스트: `Mermaid/vis.js → SVG/Canvas → PNG` → `<TransformWrapper>` 래핑.
- 회원: `mermaid → RF JSON`, `vis.js → RF JSON` 변환기 도입(서버 우선).
- 대규모: 기본 `vis-network` 리드온리, 편집 시 서브그래프 추출.

### 내보내기 세부
- **이미지**: 클라이언트 `toBlob()` → Clipboard + 다운로드.
- **PPTX**: 백엔드 `RF JSON → python-pptx` (좌표 스케일링, 스타일 매핑).
- **Slides**: 백엔드 `RF JSON → presentations.batchUpdate` (shape/connector 생성, zIndex 정렬).
- 실행 히스토리에 내보내기 옵션 메타 기록.

### 구현 단계
1. 게스트 MVP: Mermaid/vis.js → PNG/SVG, `react-zoom-pan-pinch` 팬/줌, PNG Export.
2. 무료: 변환기 + React Flow 편집 + 세션 2개 제한 + PPTX Export.
3. 유료: 검색/Slides Export/공유 링크.
4. Admin: FastAPI Admin + 모더레이션/로그/SEO/캐시.

### 리스크/보강
- Mermaid/vis.js 스타일 → RF 스타일 토큰 맵 유지, 텍스트 래핑 보정, 커넥터 라우팅 모드 통일.
- RF 월드 좌표 vs 출력 매체 좌표 변환 상수 정의.

## 15) 고급 워크스페이스 기능(2025-09-28)

### 워크스페이스 리비전 시스템
- **태스크별 영속화**: 각 태스크의 코드 리비전과 채팅 메시지를 로컬 스토리지에 개별 저장
  - `workspace.versions.{taskId}`: 해당 태스크의 전체 코드 리비전 배열
  - `workspace.messages.{taskId}`: 해당 태스크의 채팅 타임라인(질문/답변) 배열
- **드래프트 적용**: 코드 편집 시 동일 루트의 대표 버블이 최신 리비전을 가리키도록 매핑
  - 적용 후 `selectedVersionId`, `openRootId`, `openRevisionByRoot[rootId]`를 최신으로 동기화
  - 루트별 적용 리비전은 최대 5개만 유지(`pruneRevisions`)
- **질문-답변 블록 삭제**: 질문 버블과 그 뒤의 첫 번째 어시스턴트 코드 버블을 함께 제거
  - 삭제 팝오버 고정 상태(`actionBarFor`)와 제어 상태(`openDeleteFor`)로 마우스 이동 시에도 유지

### 실시간 프리뷰 시스템
- **라이브 프리뷰**: 코드 편집 시 캔버스에 즉시 반영되는 실시간 렌더링
  - `livePreviewCode`, `livePreviewEngine` 상태로 드래프트 편집 시 캔버스 실시간 렌더링
  - 편집 중인 코드와 엔진 타입을 실시간으로 반영

### Graphviz DOT 지원
- **자동 감지**: Mermaid 코드에서 Graphviz DOT 문법 자동 감지
  - `looksLikeGraphviz()` 함수로 DOT 문법 패턴 인식
  - `digraph G { ... }` 형태의 DOT 코드를 vis.js로 자동 변환
- **파서 구현**: DOT 문법을 vis.js 네트워크 데이터로 변환
  - `parseGraphvizDot()` 함수로 노드/엣지 추출
  - 라벨 매핑, ID 생성, 원형 배치 알고리즘 적용

### 고급 캔버스 기능
- **외부 리소스 인라인화**: SVG 내 외부 이미지/스타일시트를 데이터 URL로 변환
  - `inlineExternalResources()` 함수로 외부 참조 제거
  - 캔버스 오염 방지를 위한 CORS 처리 및 투명 픽셀 대체
- **투명 배경 지원**: PNG 내보내기 시 투명 배경 유지
  - 배경 사각형 자동 제거, 투명도 지원 PNG 생성
  - 노드 배경과 전체 배경 구분 로직

### 검색 및 내비게이션
- **태스크 검색**: 사이드바 슬라이딩 패널에서 모든 작업의 타이틀과 채팅 내용 검색
  - 실시간 검색, 하이라이트, 검색 결과 클릭 시 해당 태스크로 이동
- **접근성 강화**: ARIA 레이블, 키보드 내비게이션, 포커스 관리
  - `aria-current="page"`, `focus-visible` 링, 스크린 리더 지원

### 설정 및 커스터마이징
- **워크스페이스 분할**: 채팅/캔버스 비율을 20~80% 범위에서 조절
  - 설정 페이지에서 슬라이더로 변경, LocalStorage 연동
  - 실시간 반영을 위한 커스텀 이벤트 시스템


## 1) 화면·메뉴 체계 (재확인)

### 1.1 사용자 메뉴 (요약)

* **게스트**: 홈, 다이어그램(리드온리), PNG, 로그인/가입
* **무료**: 홈, 세션(최대2), React Flow 편집, PNG/PPTX, 설정
* **유료**: 홈, 세션(무제한/검색), React Flow 고급, PNG/PPTX/Slides, 공유, 설정

### 1.2 Admin 메뉴 (요약)

* 대시보드, 회원, 세션, 결제, 콘텐츠(비속어/신고), 캐시/성능, SEO, 보안/로그

---

## 2) 접근성·반응형·설정

* **모바일/태블릿**: 탭 전환(입력/코드/히스토리 ↔ 뷰), 유료 Export/공유는 Bottom Sheet
* **접근성**: ARIA, 컬러블라인드 팔레트, Export 시 **대체 텍스트(프롬프트 요약)** 삽입
* **설정 페이지**: LLM 선택(Gemini/Local), 언어/통화(i18n/CURRENCY), 스타일 프리셋, 접근성 옵션
* **프로필**: 사용자 정보/구독/결제 상태

---

## 3) 기술 스택·라이브러리

* **프론트**: Next.js(App Router), React Flow, Mermaid.js, vis-network, shadcn/ui(+Radix), Tailwind, DaisyUI/MagicUI/Aceternity UI, Tailwind Variants
* **백엔드**: FastAPI, FastAPI-Users(또는 자체 OAuth2/JWT), FastAPI Admin, SQLAlchemy+Alembic, Redis, Celery
* **DB**: PostgreSQL(JSONB), (선택) ElasticSearch
* **인증/결제/SEO/분석**: Auth.js, Stripe/토스, next-seo, next-sitemap, umami/Plausible
* **Export**: html-to-image, python-pptx, Google Slides API
* **콘텐츠 안전**: profanity-check / Perspective API

---

## 4) 단계별 개발 로드맵 + DB 스키마 초안

> 마이그레이션은 **단계별 추가** 중심으로 설계. 스키마 변경은 최소화하고, JSONB로 유연성 확보.

### 단계 1: **코어(MVP)** – 게스트 체험 (약 3주)

**기능**

* 프롬프트 → LLM → Mermaid/vis.js 리드온리 렌더링
* PNG Export
* 반응형 레이아웃

**핵심 테이블**

```sql
-- visitors: 익명(비회원) 세션 추적(쿠키/디바이스 핑거프린트)
CREATE TABLE visitors (
  id BIGSERIAL PRIMARY KEY,
  anon_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- diagrams: 다이어그램 원천 코드 + 메타 (게스트도 저장 가능: TTL 캐시성 보관)
CREATE TABLE diagrams (
  id BIGSERIAL PRIMARY KEY,
  visitor_id BIGINT REFERENCES visitors(id) ON DELETE SET NULL,
  engine TEXT CHECK (engine IN ('mermaid','visjs')) NOT NULL,
  code TEXT NOT NULL,
  render_type TEXT CHECK (render_type IN ('readonly')) DEFAULT 'readonly',
  prompt TEXT,
  meta JSONB DEFAULT '{}'::jsonb,            -- node/edge count, layout hints 등
  ttl_expire_at TIMESTAMPTZ,                 -- 게스트 보관 만료
  created_at TIMESTAMPTZ DEFAULT now()
);

-- exports: PNG 결과 이력(필요 시 S3 key만 저장)
CREATE TABLE exports (
  id BIGSERIAL PRIMARY KEY,
  diagram_id BIGINT REFERENCES diagrams(id) ON DELETE CASCADE,
  format TEXT CHECK (format IN ('png')) NOT NULL,
  storage_key TEXT,                          -- 파일 경로/키
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON diagrams USING GIN (meta);
```

**비고**

* 게스트 데이터는 TTL 만료(예: 24\~72시간). 정식 회원 전환 시 승격(마이그레이션) 가능.

---

### 단계 2: **무료 회원** (약 5주)

**기능**

* Auth(로그인/가입)
* Mermaid/vis.js → **React Flow 객체** 변환 후 편집
* **세션 2개** 저장(코드+프롬프트 히스토리)
* PPTX Export
* 프로필/설정 페이지

**추가/변경 테이블**

```sql
-- users: 기본 회원
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT,                        -- 소셜 로그인만 쓸 경우 NULL 허용
  name TEXT,
  locale TEXT DEFAULT 'ko',
  currency TEXT DEFAULT 'KRW',
  role TEXT CHECK (role IN ('user','admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- sessions: 사용자별 작업 단위(히스토리+다이어그램 묶음)
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT CHECK (status IN ('active','archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- prompts: 프롬프트 히스토리
CREATE TABLE prompts (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  llm_provider TEXT,                         -- 'gemini' | 'local' 등
  llm_params JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- diagrams (확장): 회원 소유, 편집 지원
ALTER TABLE diagrams
  ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
  ADD COLUMN render_type TEXT CHECK (render_type IN ('readonly','reactflow')) DEFAULT 'readonly',
  ADD COLUMN rf_graph JSONB;                 -- React Flow 객체 그래프(회원 편집용)

-- exports 확장: PPTX 지원
ALTER TABLE exports
  ADD COLUMN format TEXT CHECK (format IN ('png','pptx')) NOT NULL;
```

**비즈니스 로직**

* **세션 수 제한(2개)**: 애플리케이션 레벨 + DB 제약(트리거)로 이중 방어 가능
* 변환 파이프라인: `code (mermaid/visjs) → rf_graph(JSONB)` 저장

---

### 단계 3: **유료 회원** (약 6주)

**기능**

* **무제한 세션** 저장
* **검색**(프롬프트/코드/노드 라벨)
* Google Slides Export
* **공유 링크(뷰 전용)** + CTA
* Stripe/토스 구독 연동

**추가/변경 테이블**

```sql
-- subscriptions: 구독 상태
CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('stripe','toss')) NOT NULL,
  plan TEXT CHECK (plan IN ('free','pro')) NOT NULL,
  status TEXT CHECK (status IN ('active','canceled','past_due')) NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- invoices/payments: 결제 이력(간략)
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT, external_id TEXT, amount_cents INT, currency TEXT,
  status TEXT, paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

-- shares: 공유 링크(뷰 전용)
CREATE TABLE shares (
  id BIGSERIAL PRIMARY KEY,
  diagram_id BIGINT REFERENCES diagrams(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,                -- URL 토큰
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- exports 확장: Google Slides
ALTER TABLE exports
  ADD COLUMN format TEXT CHECK (format IN ('png','pptx','gslides')) NOT NULL;

-- 검색 최적화 인덱스 (Postgres FTS + json path)
CREATE MATERIALIZED VIEW search_index AS
SELECT
  d.id AS diagram_id,
  d.user_id,
  setweight(to_tsvector('simple', coalesce(d.prompt,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(d.code,'')), 'A') AS tsv
FROM diagrams d;

CREATE INDEX ON search_index USING GIN (tsv);
```

**비즈니스 로직**

* 검색은 **유료 전용** 활성화
* 공유 링크는 **Mermaid/vis.js 리드온리 뷰**에 맞춰 성능/보안 최적화

---

### 단계 4: **Admin 패널** (약 4주)

**기능**

* 회원/세션/결제/콘텐츠/캐시/SEO/보안/로그 관리
* 관리자 MFA

**추가/변경 테이블**

```sql
-- moderation: 비속어/혐오 로그 & 신고 처리
CREATE TABLE moderation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  session_id BIGINT REFERENCES sessions(id) ON DELETE SET NULL,
  prompt_id BIGINT REFERENCES prompts(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('profanity','hate','report')) NOT NULL,
  raw_text TEXT NOT NULL,
  score JSONB,                               -- API 응답 점수
  action TEXT CHECK (action IN ('none','warn','delete','ban')) DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- system_logs: API/에러/LLM 호출 로그 (샤딩/보존기간 정책 권장)
CREATE TABLE system_logs (
  id BIGSERIAL PRIMARY KEY,
  level TEXT CHECK (level IN ('INFO','WARN','ERROR')) NOT NULL,
  source TEXT,                                -- 'llm','export','auth','admin' 등
  message TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- seo_settings: 전역 SEO 설정
CREATE TABLE seo_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  meta JSONB NOT NULL,                       -- title, og, default desc 등
  robots TEXT,
  sitemap_url TEXT,
  hreflang JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- cache_admin: 캐시/성능 관리 스냅샷
CREATE TABLE cache_admin (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT,                                  -- 'redis','llm_quota'
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**운영**

* **FastAPI Admin**으로 users/sessions/diagrams/prompts/exports/subscriptions/payments/moderation\_logs/system\_logs/seo\_settings 조작
* Redis 초기화, LLM 에러 모니터링, 신고 처리 워크플로

---

## 5) ER 개요 다이어그램 (Mermaid)

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : has
  USERS ||--o{ SUBSCRIPTIONS : has
  USERS ||--o{ PAYMENTS : has
  USERS ||--o{ DIAGRAMS : owns
  USERS ||--o{ MODERATION_LOGS : triggers

  SESSIONS ||--o{ PROMPTS : contains
  SESSIONS ||--o{ DIAGRAMS : contains
  DIAGRAMS ||--o{ EXPORTS : produces
  DIAGRAMS ||--o{ SHARES : exposes

  MODERATION_LOGS }o--|| PROMPTS : on
  SEO_SETTINGS ||--|| SEO_SETTINGS : singleton
```

---

## 6) 인덱싱·성능·보안 정책(요약)

* **인덱스**: `diagrams(meta JSONB GIN)`, `search_index(tsv GIN)`, FK 인덱스
* **보존**: 게스트 TTL 만료, system\_logs 보존기간(예: 30\~90일), exports 파일 수명 정책
* **성능**: 500+ 노드 vis.js fallback, React Flow 캔버스 가상화 옵션, Celery로 Export/Slides 비동기 처리
* **보안**: 전 구간 HTTPS, JWT(짧은 수명) + Refresh, 관리자 MFA, 공유 토큰 만료

---

## 7) QA·릴리즈 전략

* **단계별 e2e 테스트**: 게스트 → 무료 → 유료 → Admin
* **마이그레이션**: Alembic 단계별 스크립트, 다운그레이드 경로 확인
* **롤백**: 주요 테이블 백업 스냅샷, 피처 플래그로 점진 오픈

---

## 16) 완전한 백엔드 시스템 구현 (2025-09-30)

### 변경 요약
- 완전한 JSON 파일 기반 데이터베이스 시스템 구축
- 태스크/세션/프롬프트/사용자/구독/결제/검색 인덱스 전체 구현
- FastAPI 라우터 시스템 완성
- 모든 데이터 엔티티에 대한 CRUD API 구현

### 상세 내용
- **완전한 JSON 데이터베이스**
  - `visitors.json`: 방문자 관리
  - `diagrams.json`: 다이어그램 저장 (세션/태스크 연결 지원)
  - `exports.json`: 익스포트 기록
  - `sessions.json`: 사용자별 세션 관리
  - `prompts.json`: 프롬프트 히스토리
  - `tasks.json`: 작업 단위 관리
  - `task_messages.json`: 태스크 메시지 타임라인
  - `task_versions.json`: 코드 리비전 관리
  - `users.json`: 사용자 프로필 관리
  - `subscriptions.json`: 구독 상태 관리
  - `payments.json`: 결제 기록
  - `shares.json`: 공유 링크 관리
  - `search_index.json`: 검색 인덱스

- **확장된 데이터 모델**
  - 모든 엔티티 간 관계 매핑 (user_id, session_id, task_id)
  - 역할 기반 접근 제어 (USER, ADMIN, OWNER)
  - 플랜별 기능 제한 (free, pro, team)
  - TTL 기반 데이터 정리 시스템

- **FastAPI 라우터 시스템**
  - `/api/sessions`: 세션 CRUD 및 프롬프트 관리
  - `/api/tasks`: 태스크 CRUD, 메시지, 버전 관리
  - `/api/users`: 사용자 프로필, 구독, 사용량 조회
  - `/api/search`: 콘텐츠 검색 및 인덱싱
  - 기존 라우터와 통합 (auth, v1, stripe, admin)

- **검색 시스템**
  - 다이어그램/프롬프트/태스크 통합 검색
  - 사용자별 검색 결과 격리
  - 메타데이터 기반 필터링
  - 실시간 검색 인덱스 업데이트

- **사용자 관리 시스템**
  - OAuth 후 사용자 자동 등록/업데이트
  - 프로필 정보 관리 (이름, 이미지, 로케일, 통화)
  - 구독 상태 추적
  - 플랜별 사용량 제한 모니터링

### API 엔드포인트 (신규 추가)

#### 세션 관리 (`/api/sessions`)
- `POST /sessions` - 새 세션 생성
- `GET /sessions` - 사용자 세션 목록
- `GET /sessions/{id}` - 세션 조회
- `PUT /sessions/{id}` - 세션 업데이트
- `POST /sessions/{id}/prompts` - 프롬프트 생성
- `GET /sessions/{id}/prompts` - 세션 프롬프트 목록

#### 태스크 관리 (`/api/tasks`)
- `POST /tasks` - 새 태스크 생성
- `GET /tasks` - 사용자 태스크 목록
- `GET /tasks/{id}` - 태스크 조회
- `PUT /tasks/{id}` - 태스크 업데이트
- `POST /tasks/{id}/messages` - 메시지 생성
- `GET /tasks/{id}/messages` - 태스크 메시지 목록
- `POST /tasks/{id}/versions` - 버전 생성
- `GET /tasks/{id}/versions` - 태스크 버전 목록
- `GET /task-versions/{id}` - 특정 버전 조회

#### 사용자 관리 (`/api/users`)
- `GET /users/me` - 현재 사용자 프로필
- `PUT /users/me` - 프로필 업데이트
- `GET /users/me/subscription` - 구독 정보
- `POST /users/register` - 사용자 등록 (OAuth 후)
- `GET /users/me/usage` - 사용량 통계

#### 검색 (`/api/search`)
- `GET /search?q={query}&types={types}` - 콘텐츠 검색
- `POST /search/index` - 검색 인덱스 생성

### 파일
- 백엔드 데이터베이스: `apps/api/database.py` (확장)
- 세션 라우터: `apps/api/session_routes.py`
- 태스크 라우터: `apps/api/task_routes.py`
- 사용자 라우터: `apps/api/user_routes.py`
- 검색 라우터: `apps/api/search_routes.py`
- 인증 시스템: `apps/api/auth.py` (User 데이터클래스 추가)
- 메인 앱: `apps/api/main.py` (라우터 통합)

### 보안/운영
- JWT 토큰 기반 인증 (모든 신규 엔드포인트)
- 사용자별 데이터 격리 (user_id 기반 필터링)
- 플랜별 기능 제한 (추후 구현)
- 파일 락킹으로 동시 접근 제어
- TTL 기반 데이터 정리 (다이어그램, 익스포트)
- 구조적 로깅 및 에러 핸들링

### 테스트 완료
- 모든 새 테이블 파일 생성 확인
- 세션/태스크/사용자 API 동작 확인
- 검색 시스템 기본 동작 확인
- JWT 인증 통합 테스트 완료

---

## 18) 캔버스 연결선 및 노드 연결 규칙 (2025-10-02)

### 연결선 스타일 시스템
- **연결선 타입**: `straight` (직선), `curved` (곡선), `orthogonal` (직각), `rounded` (둥근 직각)
- **연결점 위치**: `center` (중앙 연결), `minimal` (최소 거리), `vertex` (꼭지점 활용)
- **화살표 방향**: 연결선 스타일에 따른 적응형 각도 계산

### 연결점 계산 규칙
- **중앙 연결 (`center`)**:
  - 두 도형의 4개 변 중앙점 간 최단거리 연결
  - 상단, 우측, 하단, 좌측 변의 중앙점 우선 사용

- **최소 거리 (`minimal`)**:
  - 연결선 스타일별 최적화된 연결점 계산
  - 직선: 도형 경계선의 모든 점에서 최단거리
  - 곡선: 수평/수직 방향 우선, 변 중앙점 사용
  - 직각: 축 정렬 보너스 적용 (같은 x 또는 y 좌표)

- **꼭지점 활용 (`vertex`)**:
  - 변 중앙점 + 모서리 꼭지점 총 8개 지점 활용
  - 두 도형의 상대적 위치에 따른 방향성 보너스
  - 중심점 우선 보너스 (변 중앙점 > 모서리)

### 화살표 방향 계산
- **직선 (`straight`)**: 시작점에서 끝점으로의 직선 각도
- **곡선 (`curved`)**:
  - 최소 30도 각도 보장으로 0도 접근 방지
  - 수직 연결: 수직 방향 우선 + 수평 성분 보정
  - 수평 연결: 수평 방향 우선 + 수직 성분 보정
  - 대각선: 곡선 효과를 고려한 자연스러운 접선 방향
- **직각/둥근 직각**: 마지막 세그먼트의 수평 방향

### 곡선 경로 생성
- **수직 우세 (aspectRatio > 3)**: 90도 접근, 작은 물결 효과
- **수평 우세 (aspectRatio < 0.3)**: 90도 접근, 작은 물결 효과  
- **대각선**: 30도 이상 접근 각도 보장, 자연스러운 베지어 곡선

### 디버깅 시스템
- 화살표 계산 정보 실시간 로깅
- 연결점, 각도, 거리 정보 추적
- 프론트엔드 로그 API를 통한 서버 로깅

## 17) PostgreSQL 마이그레이션 완료 (2025-09-30)

### 변경 요약
- JSON 파일 기반 데이터베이스를 PostgreSQL로 완전 마이그레이션
- SQLAlchemy ORM 모델 및 관계 매핑 구현
- 모든 API 엔드포인트가 PostgreSQL과 연동
- JSON 파일 저장 로직 완전 제거

### 상세 내용
- **PostgreSQL 데이터베이스**
  - Docker Compose로 PostgreSQL 16 컨테이너 실행
  - 연결 정보: `postgresql://diagrammer:diagrammer123@localhost:5432/diagrammer`
  - 자동 테이블 생성 및 스키마 관리

- **SQLAlchemy ORM 모델**
  - `models.py`: 13개 테이블 모델 정의
  - UUID 기본키, 외래키 관계, 인덱스 설정
  - JSON 컬럼 지원 (meta, llm_params 등)
  - created_at/updated_at 자동 타임스탬프

- **데이터베이스 레이어**
  - `database_pg.py`: PostgreSQL 전용 데이터베이스 클래스
  - `database.py`: PostgreSQL로 리다이렉트 (하위 호환성)
  - 세션 관리, 트랜잭션, 에러 핸들링
  - 자동 사용자 생성 (테스트 모드)

- **테이블 구조**
  ```sql
  users (id, email, name, image, role, plan, status, locale, currency, created_at, updated_at)
  sessions (id, user_id, title, status, created_at, updated_at)
  prompts (id, session_id, content, llm_provider, llm_params, created_at)
  tasks (id, user_id, title, status, created_at, updated_at)
  task_messages (id, task_id, role, content, created_at)
  task_versions (id, task_id, code, engine, root_id, created_at)
  diagrams (id, visitor_id, user_id, session_id, task_id, engine, code, render_type, prompt, meta, ttl_expire_at, created_at)
  exports (id, diagram_id, format, storage_key, created_at)
  subscriptions (id, user_id, provider, plan, status, current_period_end, external_id, created_at, updated_at)
  payments (id, user_id, subscription_id, provider, external_id, amount_cents, currency, status, paid_at, created_at)
  shares (id, diagram_id, token, pin, title, expire_at, created_at)
  search_index (id, user_id, entity_type, entity_id, title, content, meta_data, created_at)
  visitors (id, anon_id, created_at)
  ```

- **관계 매핑**
  - User → Sessions, Tasks, Diagrams, Subscriptions, Payments
  - Session → Prompts, Diagrams
  - Task → Messages, Versions, Diagrams
  - Diagram → Exports, Shares

- **API 연동**
  - 모든 기존 API 엔드포인트가 PostgreSQL과 연동
  - UUID 기반 ID 시스템
  - 외래키 제약조건 및 데이터 무결성
  - 자동 사용자 생성 (테스트 모드)

### 파일 변경사항
- **신규 파일**
  - `models.py`: SQLAlchemy ORM 모델 정의
  - `database_pg.py`: PostgreSQL 데이터베이스 클래스

- **수정된 파일**
  - `database.py`: PostgreSQL로 리다이렉트
  - `auth.py`: UUID 기반 사용자 ID
  - 모든 라우터 파일: 모델 import 경로 수정

- **제거된 기능**
  - JSON 파일 저장 로직
  - 파일 락킹 시스템
  - TTL 스위퍼 (PostgreSQL에서 처리)

### 테스트 완료
- PostgreSQL 연결 및 테이블 생성 확인
- 세션/태스크 생성 및 조회 API 테스트
- 사용자 자동 생성 기능 확인
- UUID 기반 ID 시스템 동작 확인
- 외래키 제약조건 및 데이터 무결성 확인

### 성능 및 확장성
- **장점**
  - ACID 트랜잭션 보장
  - 복잡한 쿼리 및 조인 지원
  - 인덱스 기반 성능 최적화
  - 동시성 및 확장성 향상
  - 백업 및 복구 시스템

- **운영 준비**
  - Docker Compose 기반 배포
  - 환경변수 기반 설정
  - 로깅 및 에러 핸들링
  - 마이그레이션 스크립트 준비

---

