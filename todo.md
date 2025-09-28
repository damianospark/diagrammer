# Diagrammer 단계별 체크리스트 (from `prd.md`)

기준 문서: `prd.md` / 구현 원칙: React(Next.js) + FastAPI + JSON 파일 DB, Tailwind CSS + shadcn/ui, i18n(EN/KR), 접근성 우선, 좌측 사이드바(토글), Light/Dark 모드(기본 Light)

---

## 스프린트 0: 공통 준비 및 아키텍처 결정

- [x] 리포 구조 결정: `apps/web(Next.js)` / `apps/api(FastAPI)` / `packages/ui` / `packages/config`
- [x] 라이선스/README/기여가이드/코드오브컨덕트 추가
- [ ] 환경변수 표준화: `.env.example`(클라이언트/서버 분리), 보안 키/토큰 명세
- [x] 디자인 시스템 세팅: Tailwind(색상 토큰/타이포/간격 스케일), shadcn/ui 설치, Radix 프리미티브 채택
- [x] 테마: Light/Dark 토글 구현(기본 Light), 명암비 기준 확보(AA/AAA 체크)
- [x] 레이아웃: 좌측 사이드바 내비 + 토글, 헤더 유틸(언어/테마/프로필)
- [x] i18n: EN/KR 리소스 설계, 프론트(react-intl/next-intl 등) + 백엔드 로케일 협상 미들웨어
- [x] 접근성: eslint-plugin-jsx-a11y, ARIA 가이드, 키보드 내비, 포커스 링 스타일, 스킵 링크
- [x] 상태관리: 최소한(Zustand or Context)로 시작, React Query로 서버 상태 관리
- [x] API 규약: REST 우선(`/api/v1`), 일관된 에러 포맷(code, message, details)
- [x] 로깅/관측: 백엔드 구조적 로깅(JSON), 요청 ID 트레이싱, 프론트 에러 리포팅 훅
- [x] JSON 파일 DB 전략: 경로 구조/스키마 버전/락킹(파일 기반 RW 락)/쓰기 빈도 제한/롤오버 정책
- [x] 백그라운드 작업: FastAPI BackgroundTasks or Celery 대체(초기엔 단일 프로세스로 시작)
- [x] 보안: 전 구간 HTTPS 가정, JWT(짧은 수명) + Refresh, CORS/Rate limit 기본값
- [ ] 테스트: 프론트 Vitest/Testing Library, e2e는 Playwright, 백엔드 Pytest(빠른 단위 테스트)
- [ ] CI: Lint/Test/Build 파이프라인, 프리뷰 배포(브랜치)

---

## 단계 1: 코어(MVP) – 게스트 체험

### 백엔드(FastAPI)
- [x] 프로젝트 부트스트랩 및 기본 라우팅(`/healthz`)
- [x] LLM 어댑터 인터페이스 정의(`gemini`/`local` 플러그형), 개발용 Mock 구현
- [x] 엔드포인트
  - [x] POST `/api/v1/generate` 프롬프트 → Mermaid/vis.js 코드 생성(mock 사용)
  - [x] POST `/api/v1/diagrams` 게스트 다이어그램 저장(JSON DB, TTL 필드 포함)
  - [x] GET `/api/v1/diagrams/{id}` 조회(리드온리)
  - [x] POST `/api/v1/exports` PNG 메타 기록(파일 경로/키)
- [x] JSON 파일 DB 스키마
  - [x] `visitors.json`: `id, anon_id, created_at`
  - [x] `diagrams.json`: `id, visitor_id, engine, code, render_type='readonly', prompt, meta, ttl_expire_at, created_at`
  - [x] `exports.json`: `id, diagram_id, format='png', storage_key, created_at`
- [ ] TTL 스위퍼: 만료 데이터 정리(앱 스타트 시 + 주기 작업)
- [ ] 콘텐츠 안전 스텁: 비속어 감지 API 훅(로그만 저장)
- [x] 구조적 로깅 + 에러 핸들링 미들웨어
- [x] 외부에서 생성해온 차트 코드를 넣어도 캔버스에 보여줄 수 있는 자연스러운 인터페이스 제작 

### 프론트엔드(Next.js + Tailwind + shadcn/ui)
- [x] 앱 셋업(App Router), 글로벌 레이아웃, 좌측 사이드바 내비(토글)
- [x] 페이지: `홈`, `다이어그램(리드온리)`
- [x] 반응형: 입력/코드/히스토리 ↔ 뷰 탭 전환, 모바일에서 Export는 Bottom Sheet
- [x] 렌더러
  - [x] Mermaid 렌더(<100 노드)
  - [x] vis-network 렌더(≥100 노드) + 500+ 노드 성능 안전장치
- [x] PNG Export(html-to-image), Export 시 대체 텍스트(프롬프트 요약) 삽입
- [x] i18n(EN/KR) 문구 적용, 언어 스위처
- [x] 접근성: ARIA 레이블, 키보드 조작, 포커스 상태, 명암비 체크
- [ ] 방문자 식별 쿠키/핑거프린트(간단 UUID)

### 테스트/릴리즈
- [ ] e2e: 게스트 프롬프트 → 렌더 → PNG Export 흐름
- [ ] 성능 측정: 100/500 노드 케이스 렌더 시간 캡처
- [ ] 프리뷰 배포 및 QA 체크리스트 통과

### 수용 기준(DoD)
- [x] 게스트가 프롬프트로 생성/렌더/PNG 저장 가능
- [x] 크로스 디바이스 반응형 + 기본 접근성 기준 충족
- [ ] JSON DB TTL 동작 확인(만료 삭제)

---

## 단계 2: 무료 회원

### 백엔드
- [ ] 인증: 이메일/비밀번호 기반 JWT(가입/로그인/토큰 갱신), 패스워드 해시/밸리데이션
- [ ] 리소스(JSON 파일)
  - [ ] `users.json`: `id, email, password_hash, name, locale='ko', currency='KRW', role='user', created_at, updated_at`
  - [ ] `sessions.json`: `id, user_id, title, status('active'|'archived'), created_at, updated_at`
  - [ ] `prompts.json`: `id, session_id, content, llm_provider, llm_params, created_at`
  - [ ] `diagrams.json` 확장: `user_id, session_id, render_type('readonly'|'reactflow'), rf_graph(JSON)`
  - [ ] `exports.json` 확장: `format in ('png','pptx')`
- [ ] 세션 2개 제한: 서비스 레벨 검증 + 에러 코드 정의
- [ ] 변환 파이프라인: `mermaid/visjs code` → `React Flow rf_graph(JSON)` 저장
- [ ] PPTX Export: `python-pptx` 백그라운드 작업, 파일 생성/보관 정책
- [ ] 프로필/설정 API: LLM 선택, 언어/통화, 스타일 프리셋, 접근성 옵션

### 프론트엔드
- [ ] 인증 UI: 가입/로그인/비밀번호 재설정(메일 링크 스텁 OK)
- [ ] 세션 관리: 목록/생성/편집/보관, 2개 제한 UI 및 안내
- [ ] React Flow 편집기: 노드/엣지 편집, Undo/Redo, 미니맵/줌/스냅
- [ ] Import 파이프라인: Mermaid/vis.js → RF로 변환 후 편집
- [ ] Export: PPTX 요청/상태 표시/다운로드
- [ ] 설정/프로필 페이지: LLM, 언어/통화, 스타일/접근성

### 테스트/릴리즈
- [ ] 단위: 변환 파이프라인, 세션 제한, 인증 토큰 플로우
- [ ] e2e: 가입 → 세션 생성 → 편집 → PPTX Export
- [ ] 문서화: 사용자 가이드(EN/KR)

### 수용 기준(DoD)
- [ ] 로그인 사용자가 RF 편집 및 2개 세션 내 저장 가능
- [ ] PPTX Export 정상 동작 및 다운로드 가능

---

## 단계 3: 유료 회원

### 백엔드
- [ ] 구독 상태 리소스(JSON)
  - [ ] `subscriptions.json`: `user_id, provider('stripe'|'toss'), plan('free'|'pro'), status('active'|'canceled'|'past_due'), current_period_end, created_at, updated_at`
  - [ ] `payments.json`: 결제 이력 요약
- [ ] 검색: 프롬프트/코드/노드 라벨 대상 간단 FTS(토큰화/역색인 or 선형 검색, 초기 규모 가정)
- [ ] 공유 링크: `shares.json`(`diagram_id, token, expire_at, created_at`), 뷰 전용 엔드포인트
- [ ] Google Slides Export: OAuth/서비스 계정 설정, 작업 큐로 비동기 처리, 파일 키 저장
- [ ] 플랜 게이팅: 무제한 세션, 검색/슬라이드/공유는 Pro에서만 활성화

### 프론트엔드
- [ ] 빌링 UI: 플랜/상태 표시, 결제 플로(Stripe/토스) 연결
- [ ] 검색 UI: 세션/프롬프트/코드 검색, 하이라이트
- [ ] 공유: 공개 뷰 전용 페이지 + 만료/토큰 처리, CTA 포함
- [ ] Slides Export: 진행 상태/완료 알림/다운로드 링크

### 테스트/릴리즈
- [ ] 구독 시나리오 테스트(mock 게이트웨이)
- [ ] 검색 정확도/성능 스모크
- [ ] 공유 링크 보안(토큰 추측 방지, 만료)

### 수용 기준(DoD)
- [ ] Pro 사용자는 무제한 세션/검색/Slides/공유 가능
- [ ] 무료는 기능 제한이 명확히 적용됨

---

## 단계 4: Admin 패널

### 백엔드/운영
- [ ] Admin 인증 + MFA(OTP)
- [ ] 리소스(JSON)
  - [ ] `moderation_logs.json`: 비속어/혐오/신고 로그(`type, raw_text, score, action, user/session/prompt refs`)
  - [ ] `system_logs.json`: 레벨/소스/메시지/컨텍스트/타임스탬프
  - [ ] `seo_settings.json`: 메타/robots/sitemap/hreflang, 단일 리소스
  - [ ] `cache_admin.json`: 캐시/성능 메트릭 스냅샷
- [ ] 관리자 API: 목록/필터/액션(경고/삭제/밴), 로그 보존 기간 정책(30~90일)

### 프론트엔드(Admin UI)
- [ ] 대시보드: 사용자/세션/결제/콘텐츠/캐시/SEO/보안 요약 카드
- [ ] 테이블 뷰 + 필터/정렬, 행 액션, 접근성 고려 키보드/스크린리더 지원
- [ ] Redis/LLM 에러 모니터(초기엔 모킹/간이 지표)

### 테스트/릴리즈
- [ ] 권한 테스트(일반/관리자 분리)
- [ ] 로그 보존 및 정리 작업 검증

### 수용 기준(DoD)
- [ ] 주요 리소스 관리를 Admin에서 수행 가능, MFA 포함

---

## 크로스컷팅: 성능/보안/SEO/분석
- [ ] 성능: 500+ 노드 vis.js 폴백, React Flow 캔버스 가상화 옵션 탐색
- [ ] 보안: JWT 수명 짧게 + Refresh, 공유 토큰 만료, Rate limit, CSRF(필요 시)
- [ ] SEO: next-seo/next-sitemap 설정, i18n hreflang, 메타 기본값
- [ ] 분석: umami/Plausible 탑재(옵트인)

---

## 마이그레이션/데이터 전략
- [ ] JSON → RDB(Postgres) 전환 가이드 문서화(선택): 스키마 매핑, 마이그레이션 스크립트 설계 초안
- [ ] 백업/복구: 파일 스냅샷, 버전 태깅, 롤백 체크리스트

---

## QA/릴리즈 전략
- [ ] 단계별 e2e 테스트: 게스트 → 무료 → 유료 → Admin
- [ ] 기능 플래그로 점진 오픈, 롤백 시나리오 리허설
- [ ] 체인지로그, 사용자 공지(EN/KR)
