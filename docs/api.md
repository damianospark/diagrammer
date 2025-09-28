# Diagrammer SaaS API 문서

## 개요

Diagrammer SaaS API는 RESTful API를 제공하여 사용자, 조직, 결제, 관리 기능에 접근할 수 있습니다.

## 인증

### OAuth 2.0
API는 OAuth 2.0 Bearer 토큰을 사용합니다.

```bash
Authorization: Bearer <access_token>
```

### API 키
대안으로 API 키를 사용할 수 있습니다.

```bash
X-API-Key: <api_key>
```

## 기본 URL

- 개발: `http://localhost:3000/api`
- 프로덕션: `https://diagrammer.realstory.blog/api`

## 엔드포인트

### 인증

#### 로그인
```http
POST /api/auth/signin
Content-Type: application/json

{
  "provider": "google",
  "callbackUrl": "/dashboard"
}
```

#### 로그아웃
```http
POST /api/auth/signout
```

#### 세션 확인
```http
GET /api/auth/session
```

### 사용자

#### 사용자 정보 조회
```http
GET /api/user
```

#### 사용자 정보 업데이트
```http
PUT /api/user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 결제

#### Checkout 세션 생성
```http
POST /api/checkout/session
Content-Type: application/json

{
  "plan": "pro",
  "successUrl": "/success",
  "cancelUrl": "/cancel"
}
```

#### 구독 상태 조회
```http
GET /api/billing/subscription
```

#### Stripe Portal 세션 생성
```http
POST /api/stripe/portal
```

### 조직

#### 조직 목록 조회
```http
GET /api/organizations
```

#### 조직 생성
```http
POST /api/organizations
Content-Type: application/json

{
  "name": "My Organization",
  "slug": "my-org"
}
```

#### 조직 멤버 조회
```http
GET /api/organizations/{id}/members
```

#### 조직 멤버 초대
```http
POST /api/organizations/{id}/members
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "MEMBER"
}
```

### API 키 관리

#### API 키 목록 조회
```http
GET /api/keys
```

#### API 키 생성
```http
POST /api/keys
Content-Type: application/json

{
  "name": "Production API Key",
  "permissions": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### API 키 업데이트
```http
PUT /api/keys/{id}
Content-Type: application/json

{
  "name": "Updated API Key",
  "status": "active"
}
```

#### API 키 삭제
```http
DELETE /api/keys/{id}
```

### 웹훅

#### 웹훅 목록 조회
```http
GET /api/webhooks
```

#### 웹훅 생성
```http
POST /api/webhooks
Content-Type: application/json

{
  "name": "User Events",
  "url": "https://api.example.com/webhooks/users",
  "events": ["user.created", "user.updated"]
}
```

### 관리자 (OWNER/ADMIN 권한 필요)

#### 사용자 관리
```http
GET /api/admin/users
PUT /api/admin/users/{id}
DELETE /api/admin/users/{id}
```

#### 조직 관리
```http
GET /api/admin/organizations
PUT /api/admin/organizations/{id}
DELETE /api/admin/organizations/{id}
```

#### 결제 관리
```http
GET /api/admin/billing
PUT /api/admin/billing/{id}
```

#### 감사 로그
```http
GET /api/admin/audit
```

#### 기능 플래그
```http
GET /api/admin/features
POST /api/admin/features
PUT /api/admin/features/{id}
DELETE /api/admin/features/{id}
```

### 시스템

#### 헬스 체크
```http
GET /api/health
```

#### 메트릭
```http
GET /api/metrics
```

#### 백업 (OWNER 권한 필요)
```http
GET /api/backup
POST /api/backup
```

## 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": {
    // 응답 데이터
  }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 상태 코드

- `200` - 성공
- `201` - 생성됨
- `400` - 잘못된 요청
- `401` - 인증 필요
- `403` - 권한 없음
- `404` - 리소스 없음
- `429` - 레이트 리미트 초과
- `500` - 서버 오류

## 레이트 리미팅

API는 레이트 리미팅을 적용합니다:

- 일반 API: 시간당 1000회
- 인증 API: 15분당 5회
- Checkout API: 1분당 10회

레이트 리미트 정보는 응답 헤더에 포함됩니다:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 웹훅 이벤트

### 사용자 이벤트
- `user.created` - 사용자 생성
- `user.updated` - 사용자 정보 업데이트
- `user.deleted` - 사용자 삭제

### 결제 이벤트
- `billing.subscription_created` - 구독 생성
- `billing.subscription_updated` - 구독 업데이트
- `billing.subscription_canceled` - 구독 취소
- `billing.payment_succeeded` - 결제 성공
- `billing.payment_failed` - 결제 실패

### 조직 이벤트
- `org.created` - 조직 생성
- `org.updated` - 조직 업데이트
- `org.member_added` - 멤버 추가
- `org.member_removed` - 멤버 제거

## 웹훅 페이로드 예시

### 사용자 생성
```json
{
  "event": "user.created",
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 구독 생성
```json
{
  "event": "billing.subscription_created",
  "data": {
    "userId": "user_123",
    "plan": "pro",
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## SDK 및 라이브러리

### JavaScript/TypeScript
```bash
npm install @diagrammer/sdk
```

```javascript
import { DiagrammerClient } from '@diagrammer/sdk'

const client = new DiagrammerClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://diagrammer.realstory.blog/api'
})

// 사용자 정보 조회
const user = await client.users.get()

// 조직 생성
const org = await client.organizations.create({
  name: 'My Organization',
  slug: 'my-org'
})
```

### Python
```bash
pip install diagrammer-sdk
```

```python
from diagrammer import DiagrammerClient

client = DiagrammerClient(
    api_key='your-api-key',
    base_url='https://diagrammer.realstory.blog/api'
)

# 사용자 정보 조회
user = client.users.get()

# 조직 생성
org = client.organizations.create(
    name='My Organization',
    slug='my-org'
)
```

## 오류 처리

### 일반적인 오류 코드

- `INVALID_API_KEY` - 잘못된 API 키
- `RATE_LIMIT_EXCEEDED` - 레이트 리미트 초과
- `INSUFFICIENT_PERMISSIONS` - 권한 부족
- `RESOURCE_NOT_FOUND` - 리소스 없음
- `VALIDATION_ERROR` - 입력 검증 오류
- `SUBSCRIPTION_REQUIRED` - 구독 필요
- `FEATURE_DISABLED` - 기능 비활성화

### 재시도 로직

일시적인 오류의 경우 지수 백오프를 사용하여 재시도하세요:

```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

## 지원

API 관련 문의사항이 있으시면 다음으로 연락해주세요:

- 이메일: api-support@diagrammer.realstory.blog
- 문서: https://docs.diagrammer.realstory.blog
- 상태 페이지: https://status.diagrammer.realstory.blog
