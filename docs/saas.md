# Diagrammer SaaS 사이트 구축 가이드

## 1. 개요

### 1.1 Email 인증 없음 + OAuth 전용 배경
- **이메일 인증 제거**: 사용자 경험 단순화 및 스팸 방지
- **OAuth 전용**: Google, Facebook, GitHub, Kakao, Naver 소셜 로그인만 지원
- **Stripe Checkout 이메일**: 결제 시 수집된 이메일을 User.email에 동기화
- **Passkey 옵션**: 향후 생체인증 지원을 위한 확장성 고려

### 1.2 코어 앱과의 역할 분담
- **SaaS 사이트**: 마케팅, 가입, 결제, 구독관리, 어드민 허브
- **코어 앱**: 실제 다이어그램 생성/편집 기능 (별도 도메인)
- **연계**: JWT 토큰 기반 SSO, 구독 상태 동기화

### 1.3 도메인 구조
- **Primary Domain**: `https://diagrammer.realstory.blog`
- **App Domain**: `https://app.diagrammer.realstory.blog` (코어 앱)
- **Admin**: `https://diagrammer.realstory.blog/admin`

## 2. 아키텍처

```mermaid
graph TB
    subgraph "SaaS 사이트 (diagrammer.realstory.blog)"
        A[Next.js App Router]
        B[Auth.js v5 + OAuth]
        C[Prisma + PostgreSQL]
        D[Stripe Checkout]
        E[Origin UI Admin]
        F[shadcn/ui Components]
    end
    
    subgraph "코어 앱 (app.diagrammer.realstory.blog)"
        G[Next.js Workspace]
        H[FastAPI Backend]
        I[JSON File DB]
    end
    
    subgraph "외부 서비스"
        J[Google OAuth]
        K[Facebook OAuth]
        L[GitHub OAuth]
        M[Kakao OAuth]
        N[Naver OAuth]
        O[Stripe API]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    B --> J
    B --> K
    B --> L
    B --> M
    B --> N
    D --> O
    A -.->|JWT SSO| G
    C -.->|구독 상태| H
```

## 3. 라우팅 트리/네비게이션 구조

### 3.1 공개 라우트
- `/` - 랜딩 페이지 (Hero, 기능, 데모, CTA)
- `/pricing` - 요금제/기능 비교/FAQ
- `/login` - OAuth 로그인 전용
- `/legal/terms` - 이용약관
- `/legal/privacy` - 개인정보처리방침
- `/share/[id]` - 퍼블릭 공유 뷰 (선택)

### 3.2 인증 필요 라우트
- `/app` - 코어 앱으로 리다이렉트
- `/settings` - 프로필, 보안, 청구정보
- `/settings/billing` - Stripe Portal 링크

### 3.3 관리자 전용 라우트
- `/admin` - 관리자 대시보드
- `/admin/users` - 사용자 관리
- `/admin/organizations` - 조직 관리
- `/admin/billing` - 결제/구독 관리
- `/admin/plans` - 플랜/엔타이틀 관리
- `/admin/audit` - 감사 로그
- `/admin/features` - 기능 플래그
- `/admin/integrations` - 통합 관리

### 3.4 미들웨어 가드
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/app/:path*',
    '/settings/:path*',
    '/admin/:path*'
  ]
}

// 가드 규칙
- /app/**, /settings/** : 로그인 필요
- /admin/** : role ∈ {OWNER, ADMIN}만 접근
- 플랜/엔타이틀에 따른 기능 토글 가드
```

## 4. 인증 (Auth.js v5)

### 4.1 OAuth 전용 설정
```typescript
// auth.ts
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import GitHub from "next-auth/providers/github"
import Kakao from "next-auth/providers/kakao"
import Naver from "next-auth/providers/naver"

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
    Naver({
      clientId: process.env.AUTH_NAVER_ID!,
      clientSecret: process.env.AUTH_NAVER_SECRET!,
    }),
  ],
  // Email Provider 제거
  // VerificationToken 테이블 미사용
}
```

### 4.2 Passkey 옵션 (PASSKEY_ENABLED=true)
```typescript
// passkey.ts (옵션)
import { SimpleWebAuthnServer } from '@simplewebauthn/server'

// WebAuthn 등록/인증 라우트
// /api/passkey/register
// /api/passkey/authenticate
```

### 4.3 세션 전략
- **저장소**: Database (Prisma)
- **세션 타입**: JWT + Database 하이브리드
- **만료**: 30일 (설정 가능)

## 5. 결제/구독 (Stripe)

### 5.1 Checkout → Webhook → Entitlements 동기화 시퀀스

```mermaid
sequenceDiagram
    participant U as User
    participant W as Website(Next.js)
    participant A as Auth.js
    participant S as Stripe
    participant DB as DB/Prisma
    
    U->>W: OAuth 로그인
    W->>A: 세션 발급
    U->>W: Pro 구독 클릭
    W->>S: Checkout Session 생성(client_reference_id=user.id)
    U->>S: 결제/이메일 입력
    S-->>W: 리다이렉트(성공)
    S-->>W: webhook(checkout.session.completed)
    W->>DB: BillingProfile(stripeCustomerId, email) 보강
    S-->>W: webhook(customer.subscription.updated)
    W->>DB: plan/status/entitlements 동기화
    U->>W: /app 접근
    W->>DB: 권한 확인(플랜 별 엔타이틀 가드)
    W-->>U: 접근 허용/제한
```

### 5.2 Stripe 설정
```typescript
// stripe.ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Checkout Session 생성
export async function createCheckoutSession({
  userId,
  priceId,
  successUrl,
  cancelUrl
}: {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}
```

### 5.3 Webhook 처리
```typescript
// api/stripe/webhook.ts
export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object)
      break
  }
}
```

## 6. 데이터 모델 (Prisma 스키마)

### 6.1 스키마 요약
```prisma
// schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique // nullable, Stripe에서 보강
  name          String?
  image         String?
  role          Role      @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  billingProfile BillingProfile?
  orgMembers    OrgMember[]
  auditLogs     AuditLog[]
}

model BillingProfile {
  id                String   @id @default(cuid())
  userId            String   @unique
  stripeCustomerId  String?  @unique
  email             String?  // Stripe에서 보강
  plan              Plan     @default(FREE)
  status            SubscriptionStatus @default(ACTIVE)
  renewedAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  plan        Plan     @default(FREE)
  status      OrgStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     OrgMember[]
  auditLogs   AuditLog[]
}

model AuditLog {
  id          String   @id @default(cuid())
  action      String
  resource    String
  resourceId  String?
  userId      String?
  orgId       String?
  metadata    Json?
  createdAt   DateTime @default(now())
  
  user        User?    @relation(fields: [userId], references: [id])
  org         Organization? @relation(fields: [orgId], references: [id])
}

model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  description String?
  enabled     Boolean  @default(false)
  rollout     Int      @default(0) // 0-100%
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
  OWNER
}

enum Plan {
  FREE
  PRO
  TEAM
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}
```

### 6.2 ERD
```mermaid
erDiagram
    User ||--o| BillingProfile : has
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ OrgMember : has
    User ||--o{ AuditLog : creates
    
    Organization ||--o{ OrgMember : has
    Organization ||--o{ AuditLog : contains
    
    BillingProfile {
        string id PK
        string userId FK
        string stripeCustomerId
        string email
        enum plan
        enum status
        datetime renewedAt
    }
    
    User {
        string id PK
        string email
        string name
        string image
        enum role
        enum status
        datetime createdAt
    }
    
    Organization {
        string id PK
        string name
        string slug
        enum plan
        enum status
        datetime createdAt
    }
```

## 7. Admin 요구사항

### 7.1 관리 항목 상세

#### Users 관리
- **검색/필터**: 이메일, 이름, 역할, 상태, 가입일
- **편집**: 역할 변경, 상태 변경 (ACTIVE/SUSPENDED/DELETED)
- **보안**: 전세션 만료, OAuth 언링크, Passkey 강제 등록
- **구독**: 플랜 변경, 구독 상태 확인

#### Organizations 관리
- **생성/편집**: 조직명, 슬러그, 플랜 설정
- **멤버 관리**: 초대, 역할 변경 (OWNER/ADMIN/MEMBER)
- **사용량**: 세션 수, 메시지 수, 노드 수 모니터링

#### Billing 관리
- **Stripe 연동**: 사용자↔Stripe Customer 매핑
- **구독 상태**: 활성/해지/과금중지 상태 관리
- **결제 이력**: Read-only 결제 내역 조회
- **쿠폰/크레딧**: Owner만 관리 가능

#### Plans/Entitlements 관리
- **플랜 정의**: 가격, 기능, 한도 설정
- **엔타이틀**: 차트 엔진, 최대 노드, Export 종류, 팀 수, API 액세스

#### Audit Log 관리
- **민감 변경 이력**: 역할/플랜/상태/조직 변경 기록
- **검색/필터**: 사용자, 액션, 리소스, 기간별 필터링

#### Feature Flags 관리
- **점진적 공개**: 코어 앱 신기능 토글
- **롤아웃**: 0-100% 단계적 배포

#### Integrations 관리
- **SSO/SAML**: 엔터프라이즈 SSO 설정
- **Webhooks**: 외부 시스템 연동 관리
- **API 키**: 개발자 API 액세스 관리

### 7.2 코어 앱 기능/한도 매핑표

| 기능 | Free | Pro | Team |
|------|------|-----|------|
| 저장 가능한 세션 수 | 2 | 200 | 무제한 |
| 일일 메시지 한도 | 100 | 2,000 | 10,000 |
| 최대 그래프 노드 수 | 100 | 1,000 | 5,000 |
| Export 종류 | PNG | PNG, PPTX | PNG, PPTX, Google Slides |
| 퍼블릭 공유 | X | O | O |
| 버전 기록 | X | O (최근 10회) | O (무제한) |
| 팀 협업 | X | X | O (좌석 수 내) |
| API 액세스 | X | O (읽기 전용) | O (읽기+쓰기) |

## 8. 마케팅 페이지

### 8.1 랜딩/Hero 카피 초안
```
# 채팅으로 즉시 차트를 생성하세요

AI가 이해하는 자연어로 복잡한 다이어그램을 몇 초 만에 만들어보세요.
Mermaid, vis.js, Graphviz를 자동으로 선택해 최적의 시각화를 제공합니다.

[무료로 시작하기] [데모 보기]
```

### 8.2 Pricing 비교표

| 항목 | Free | Pro | Team |
|------|------|-----|------|
| 월 가격 | ₩0 | ₩15,000 /월 | ₩49,000 /월 (5석 포함) |
| 포함 좌석(Seats) | 1 | 1 | 5 (추가 좌석 ₩7,000/월) |
| 저장 가능한 세션 수 | 2 | 200 | 무제한 |
| 일일 메시지 한도 | 100 | 2,000 | 10,000 |
| 최대 그래프 노드 수 | 100 | 1,000 | 5,000 |
| Export | PNG | PNG, PPTX | PNG, PPTX, Google Slides |
| 퍼블릭 공유 | X | O | O |
| 버전 기록(Revision) | X | O (최근 10회) | O (무제한) |
| 팀 협업(동시 편집) | X | X | O (좌석 수 내) |
| 우선 처리(Queue Priority) | 표준 | 높음 | 최상 |
| 전용 리소스(한도 상향) | X | O (Pro 리밋 상향) | O (Team 리밋 상향) |
| API 액세스 | X | O (읽기 전용) | O (읽기+쓰기, 생성 한도 상향) |
| SSO/SAML | X | X | 옵션(엔터프라이즈 애드온) |
| 지원 | 커뮤니티 | 표준 메일 지원 | 우선 메일/슬랙 지원 |

### 8.3 FAQ 구조화 데이터 예시
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "무료 플랜에서도 모든 기능을 사용할 수 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "무료 플랜에서는 기본적인 다이어그램 생성과 PNG 내보내기가 가능합니다. Pro 플랜에서는 PPTX 내보내기, 퍼블릭 공유, 버전 기록 등 고급 기능을 사용할 수 있습니다."
      }
    },
    {
      "@type": "Question",
      "name": "팀 플랜에서 추가 좌석은 어떻게 구매하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "팀 플랜 기본 5석을 초과하는 경우, 추가 좌석당 월 ₩7,000의 요금이 부과됩니다. Stripe Portal에서 언제든지 좌석 수를 조정할 수 있습니다."
      }
    }
  ]
}
```

## 9. 보안/운영

### 9.1 레이트리밋
```typescript
// rate-limit.ts
export const rateLimit = {
  login: '5 attempts per 15 minutes',
  checkout: '3 attempts per hour',
  webhook: '100 requests per minute',
  api: '1000 requests per hour per user'
}
```

### 9.2 감사로그
- **민감 변경**: 역할, 플랜, 상태, 조직 변경
- **보안 이벤트**: 로그인, 로그아웃, OAuth 언링크
- **관리자 액션**: 모든 Admin 작업 기록

### 9.3 권한 모델
```typescript
enum Permission {
  // User permissions
  READ_PROFILE = 'read:profile',
  UPDATE_PROFILE = 'update:profile',
  
  // Admin permissions
  READ_USERS = 'read:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // Owner permissions
  MANAGE_BILLING = 'manage:billing',
  MANAGE_PLANS = 'manage:plans',
  MANAGE_ORGS = 'manage:orgs'
}
```

### 9.4 에러/로깅
```typescript
// logging.ts
export const logger = {
  error: (message: string, error?: Error, context?: any) => {
    // Sentry, LogRocket 등에 전송
  },
  audit: (action: string, userId: string, resource: string) => {
    // AuditLog 테이블에 기록
  }
}
```

## 10. 환경변수

### 10.1 .env.example
```bash
# --- 데이터베이스 ---
DATABASE_URL="postgresql://user:pass@host:5432/diagrammer"

# --- Auth.js v5 / OAuth ---
AUTH_SECRET="generate-strong-secret"
AUTH_GOOGLE_ID="xxx"
AUTH_GOOGLE_SECRET="xxx"
AUTH_FACEBOOK_ID="xxx"
AUTH_FACEBOOK_SECRET="xxx"
AUTH_GITHUB_ID="xxx"
AUTH_GITHUB_SECRET="xxx"
AUTH_KAKAO_ID="xxx"
AUTH_KAKAO_SECRET="xxx"
AUTH_NAVER_ID="xxx"
AUTH_NAVER_SECRET="xxx"

# --- Stripe ---
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_PRICE_PRO_MONTHLY="price_xxx"
STRIPE_PRICE_TEAM_MONTHLY="price_xxx"
STRIPE_PORTAL_RETURN_URL="https://diagrammer.realstory.blog/settings"

# --- 퍼블릭 ---
NEXT_PUBLIC_APP_NAME="Diagrammer"
NEXT_PUBLIC_PRIMARY_DOMAIN="https://diagrammer.realstory.blog"
NEXT_PUBLIC_APP_DOMAIN="https://app.diagrammer.realstory.blog"

# --- 옵션 ---
PASSKEY_ENABLED="false"
SENTRY_DSN="xxx"
```

## 11. 설치/실행/배포 가이드

### 11.1 로컬 개발
```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# 3. 데이터베이스 설정
npx prisma generate
npx prisma db push

# 4. 개발 서버 실행
npm run dev
```

### 11.2 스테이징 배포
```bash
# 1. 빌드
npm run build

# 2. 데이터베이스 마이그레이션
npx prisma migrate deploy

# 3. 배포 (Vercel, Railway 등)
vercel deploy --prod
```

### 11.3 프로덕션 배포
```bash
# 1. 환경변수 설정 (프로덕션)
# 2. 데이터베이스 백업
# 3. 마이그레이션 실행
# 4. 배포
# 5. 헬스체크 확인
```

## 12. TODO 로드맵

### Phase 1: 기본 인프라 (1-2주)
- [ ] Auth.js v5 설정 (OAuth 전용)
- [ ] Prisma 스키마 및 마이그레이션
- [ ] Stripe Checkout 연동
- [ ] 기본 미들웨어 가드
- [ ] 환경변수 설정

### Phase 2: 핵심 기능 (2-3주)
- [ ] 랜딩 페이지 (Hero, 기능, 데모)
- [ ] Pricing 페이지 (Stripe Checkout 연동)
- [ ] 로그인/설정 페이지
- [ ] Stripe Webhook 처리
- [ ] 엔타이틀 시스템

### Phase 3: Admin 시스템 (2-3주)
- [ ] Origin UI Admin 레이아웃
- [ ] 사용자 관리 (CRUD, 검색, 필터)
- [ ] 조직 관리
- [ ] 결제/구독 관리
- [ ] 감사 로그 시스템

### Phase 4: 고급 기능 (1-2주)
- [ ] 기능 플래그 시스템
- [ ] API 키 관리
- [ ] SSO/SAML 연동 (옵션)
- [ ] 성능 최적화
- [ ] 보안 강화

### Phase 5: 운영 준비 (1주)
- [ ] 모니터링/로깅 설정
- [ ] 백업/복구 시스템
- [ ] 문서화 완성
- [ ] E2E 테스트
- [ ] 프로덕션 배포

## 13. Entitlements 매핑

### 13.1 JSON 설정
```json
{
  "free": {
    "seats": 1,
    "sessions": 2,
    "messagesPerDay": 100,
    "maxNodes": 100,
    "exports": ["png"],
    "publicShare": false,
    "revision": "none",
    "collab": false,
    "queue": "standard",
    "api": "none",
    "sso": false
  },
  "pro": {
    "seats": 1,
    "sessions": 200,
    "messagesPerDay": 2000,
    "maxNodes": 1000,
    "exports": ["png", "pptx"],
    "publicShare": true,
    "revision": "10",
    "collab": false,
    "queue": "high",
    "api": "read",
    "sso": false
  },
  "team": {
    "seats": 5,
    "sessions": "unlimited",
    "messagesPerDay": 10000,
    "maxNodes": 5000,
    "exports": ["png", "pptx", "slides"],
    "publicShare": true,
    "revision": "unlimited",
    "collab": true,
    "queue": "highest",
    "api": "readwrite",
    "sso": "addon"
  }
}
```

### 13.2 TypeScript 타입
```typescript
export interface Entitlements {
  seats: number
  sessions: number | 'unlimited'
  messagesPerDay: number
  maxNodes: number
  exports: string[]
  publicShare: boolean
  revision: string | 'none' | 'unlimited'
  collab: boolean
  queue: 'standard' | 'high' | 'highest'
  api: 'none' | 'read' | 'readwrite'
  sso: boolean | 'addon'
}

export const ENTITLEMENTS: Record<Plan, Entitlements> = {
  // 위 JSON과 동일
}
```

---

이 문서는 Diagrammer SaaS 사이트의 완전한 구축 가이드입니다. 각 섹션의 구현 세부사항을 따라 단계별로 개발을 진행하면 됩니다.
