# Diagrammer SaaS 배포 가이드

## 개요

이 문서는 Diagrammer SaaS 사이트의 프로덕션 배포를 위한 상세 가이드입니다.

## 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   CDN (CloudFlare) │    │   Static Assets │
│   (Nginx)       │    │                 │    │   (Vercel)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Next.js App   │
                    │   (Vercel)      │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Supabase)    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Redis Cache   │
                    │   (Upstash)     │
                    └─────────────────┘
```

## 환경 설정

### 1. Vercel 배포

#### 프로젝트 설정
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
cd apps/web
vercel --prod
```

#### 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정합니다:

```bash
# 데이터베이스
DATABASE_URL=postgresql://user:pass@host:5432/diagrammer

# Auth.js
AUTH_SECRET=your-secret-key
AUTH_URL=https://diagrammer.realstory.blog

# OAuth Providers
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_FACEBOOK_ID=your-facebook-app-id
AUTH_FACEBOOK_SECRET=your-facebook-app-secret
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
AUTH_KAKAO_ID=your-kakao-rest-api-key
AUTH_KAKAO_SECRET=your-kakao-client-secret
AUTH_NAVER_ID=your-naver-client-id
AUTH_NAVER_SECRET=your-naver-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_PRO_MONTHLY=price_your-pro-price-id
STRIPE_PRICE_TEAM_MONTHLY=price_your-team-price-id
STRIPE_PORTAL_RETURN_URL=https://diagrammer.realstory.blog/settings

# Public
NEXT_PUBLIC_APP_NAME=Diagrammer
NEXT_PUBLIC_PRIMARY_DOMAIN=https://diagrammer.realstory.blog
NEXT_PUBLIC_APP_DOMAIN=https://app.diagrammer.realstory.blog

# Monitoring (선택사항)
SENTRY_DSN=your-sentry-dsn
```

### 2. 데이터베이스 설정 (Supabase)

#### 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 데이터베이스 URL 복사
3. SQL Editor에서 Prisma 스키마 실행

#### 마이그레이션 실행
```bash
cd apps/web
npx prisma migrate deploy
```

#### 데이터베이스 연결 테스트
```bash
npx prisma db pull
npx prisma generate
```

### 3. Redis 설정 (Upstash)

#### Redis 인스턴스 생성
1. [Upstash](https://upstash.com)에서 Redis 인스턴스 생성
2. 연결 정보 복사

#### 환경 변수 추가
```bash
REDIS_URL=redis://user:pass@host:port
REDIS_TOKEN=your-redis-token
```

### 4. 도메인 설정

#### DNS 설정
```
# A 레코드
diagrammer.realstory.blog -> Vercel IP

# CNAME 레코드
www.diagrammer.realstory.blog -> diagrammer.realstory.blog
app.diagrammer.realstory.blog -> app-vercel-domain.vercel.app
```

#### SSL 인증서
Vercel에서 자동으로 SSL 인증서를 발급받습니다.

## CI/CD 파이프라인

### GitHub Actions

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/web
```

### 환경 변수 설정
GitHub Secrets에 다음 값들을 설정합니다:

- `VERCEL_TOKEN`: Vercel API 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID

## 모니터링 및 로깅

### 1. Sentry 설정

#### 프로젝트 생성
1. [Sentry](https://sentry.io)에서 새 프로젝트 생성
2. DSN 복사

#### 환경 변수 추가
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=diagrammer-saas
SENTRY_AUTH_TOKEN=your-auth-token
```

### 2. Vercel Analytics

#### Analytics 활성화
```bash
# Vercel CLI로 Analytics 활성화
vercel analytics enable
```

### 3. Uptime 모니터링

#### UptimeRobot 설정
1. [UptimeRobot](https://uptimerobot.com)에서 모니터 생성
2. 다음 URL들을 모니터링:
   - `https://diagrammer.realstory.blog`
   - `https://diagrammer.realstory.blog/api/health`

## 보안 설정

### 1. 보안 헤더

#### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### 2. CSP (Content Security Policy)

#### `middleware.ts`에서 설정
```typescript
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
)
```

## 백업 및 복구

### 1. 데이터베이스 백업

#### 자동 백업 설정
```bash
# Supabase에서 자동 백업 활성화
# 대시보드 -> Settings -> Database -> Backups
```

#### 수동 백업
```bash
# pg_dump를 사용한 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 파일 백업

#### Vercel Functions 로그
```bash
# Vercel CLI로 로그 확인
vercel logs --follow
```

## 성능 최적화

### 1. 이미지 최적화

#### Next.js Image 컴포넌트 사용
```typescript
import Image from 'next/image'

<Image
  src="/hero-image.jpg"
  alt="Hero Image"
  width={800}
  height={600}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 2. 코드 분할

#### 동적 임포트 사용
```typescript
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <p>Loading...</p>,
  ssr: false
})
```

### 3. 캐싱 전략

#### API 응답 캐싱
```typescript
export async function GET() {
  const data = await fetchData()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

## 트러블슈팅

### 1. 일반적인 문제

#### 빌드 실패
```bash
# 의존성 문제 해결
rm -rf node_modules package-lock.json
npm install

# 타입 오류 확인
npm run type-check
```

#### 환경 변수 문제
```bash
# 환경 변수 확인
vercel env ls

# 환경 변수 추가
vercel env add VARIABLE_NAME
```

### 2. 데이터베이스 연결 문제

#### 연결 테스트
```bash
# Prisma 연결 테스트
npx prisma db pull

# 마이그레이션 상태 확인
npx prisma migrate status
```

### 3. OAuth 설정 문제

#### 리다이렉트 URI 확인
- Google: `https://diagrammer.realstory.blog/api/auth/callback/google`
- Facebook: `https://diagrammer.realstory.blog/api/auth/callback/facebook`
- GitHub: `https://diagrammer.realstory.blog/api/auth/callback/github`

## 롤백 절차

### 1. Vercel 롤백

#### 이전 배포로 롤백
```bash
# Vercel CLI로 롤백
vercel rollback [deployment-url]
```

#### 대시보드에서 롤백
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Deployments 탭
4. 이전 배포 선택 후 Promote

### 2. 데이터베이스 롤백

#### 마이그레이션 롤백
```bash
# 특정 마이그레이션으로 롤백
npx prisma migrate resolve --rolled-back [migration-name]
```

## 확장성 고려사항

### 1. 수평 확장

#### Vercel Edge Functions
```typescript
// edge runtime 사용
export const config = {
  runtime: 'edge'
}
```

### 2. 데이터베이스 최적화

#### 인덱스 추가
```sql
-- 사용자 이메일 인덱스
CREATE INDEX idx_users_email ON "User"(email);

-- 결제 프로필 사용자 ID 인덱스
CREATE INDEX idx_billing_profile_user_id ON "BillingProfile"(userId);
```

### 3. 캐싱 전략

#### Redis 캐싱
```typescript
import { redis } from '@/lib/redis'

export async function getCachedData(key: string) {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  
  const data = await fetchData()
  await redis.setex(key, 3600, JSON.stringify(data))
  return data
}
```

## 지원 및 문의

배포 관련 문의사항이 있으시면 다음으로 연락해주세요:

- 이메일: devops@diagrammer.realstory.blog
- 문서: https://docs.diagrammer.realstory.blog
- 상태 페이지: https://status.diagrammer.realstory.blog
