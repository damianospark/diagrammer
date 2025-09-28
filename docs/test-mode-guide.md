# 테스트 모드 가이드

## 개요

Diagrammer SaaS 사이트에서 OAuth Provider 설정 없이도 미리 정의된 테스트 사용자로 로그인할 수 있는 테스트 모드입니다. 개발 환경에서만 활성화되며, 다양한 역할과 플랜의 사용자를 테스트할 수 있습니다.

## 테스트 모드 활성화

### 1. 환경변수 설정

`apps/web/.env.local` 파일에 다음 설정을 추가:

```bash
# 테스트 모드 활성화
NEXT_PUBLIC_TEST_MODE="true"
```

### 2. 개발 서버 재시작

```bash
cd apps/web
npm run dev
```

## 미리 정의된 테스트 사용자

### 일반 사용자

| 이메일 | 이름 | 역할 | 플랜 | 상태 | 설명 |
|--------|------|------|------|------|------|
| `user@test.com` | 테스트 사용자 | USER | free | ACTIVE | 기본 Free 플랜 사용자 |
| `pro@test.com` | Pro 사용자 | USER | pro | ACTIVE | Pro 플랜 사용자 |
| `team@test.com` | Team 사용자 | USER | team | ACTIVE | Team 플랜 사용자 |

### 관리자

| 이메일 | 이름 | 역할 | 플랜 | 상태 | 설명 |
|--------|------|------|------|------|------|
| `admin@test.com` | 관리자 | ADMIN | pro | ACTIVE | 관리자 권한 사용자 |
| `owner@test.com` | 소유자 | OWNER | team | ACTIVE | 최고 권한 사용자 |

### 특수 상태 사용자

| 이메일 | 이름 | 역할 | 플랜 | 상태 | 설명 |
|--------|------|------|------|------|------|
| `inactive@test.com` | 비활성 사용자 | USER | free | INACTIVE | 비활성 상태 사용자 |
| `suspended@test.com` | 정지된 사용자 | USER | free | SUSPENDED | 정지된 사용자 |

## 테스트 모드 사용 방법

### 1. 테스트 로그인 페이지 접속

개발 환경에서 다음 URL로 접속:

```
http://localhost:3000/test-login
```

### 2. 사용자 선택 및 로그인

- 활성 사용자 탭: 정상적으로 로그인할 수 있는 사용자들
- 비활성 사용자 탭: 비활성 또는 정지된 사용자들

원하는 사용자를 선택하고 "로그인" 버튼을 클릭합니다.

### 3. 앱 사용

로그인 성공 후 `/app` 페이지로 자동 리디렉션됩니다.

## 권한별 테스트 시나리오

### 1. 일반 사용자 테스트

**Free 플랜 사용자 (`user@test.com`)**
- 기본 기능 사용 가능
- 제한된 세션 수 (2개)
- 제한된 일일 메시지 (100개)
- 기본 내보내기 (PNG만)

**Pro 플랜 사용자 (`pro@test.com`)**
- 고급 기능 사용 가능
- 더 많은 세션 수 (200개)
- 더 많은 일일 메시지 (2,000개)
- 고급 내보내기 (PNG, PPTX)

**Team 플랜 사용자 (`team@test.com`)**
- 모든 기능 사용 가능
- 무제한 세션
- 많은 일일 메시지 (10,000개)
- 모든 내보내기 (PNG, PPTX, Google Slides)

### 2. 관리자 테스트

**관리자 (`admin@test.com`)**
- `/admin` 페이지 접근 가능
- 사용자 관리 기능
- 결제 관리 기능
- 조직 관리 기능
- 감사 로그 조회

**소유자 (`owner@test.com`)**
- 모든 관리자 기능
- 시스템 설정 변경
- 사용자 역할 변경
- 조직 소유권 관리

### 3. 특수 상태 테스트

**비활성 사용자 (`inactive@test.com`)**
- 로그인 시도 시 오류 메시지 표시
- 계정 상태 확인 기능 테스트

**정지된 사용자 (`suspended@test.com`)**
- 로그인 시도 시 오류 메시지 표시
- 정지 상태 처리 기능 테스트

## API 엔드포인트

### 테스트 모드 로그인

```bash
POST /api/test-mode/login
Content-Type: application/json

{
  "email": "user@test.com"
}
```

### 테스트 모드 로그아웃

```bash
POST /api/test-mode/logout
```

### 테스트 모드 세션 조회

```bash
GET /api/test-mode/session
```

### 테스트 사용자 목록 조회

```bash
GET /api/test-mode/login?role=USER&plan=pro&status=ACTIVE
```

## 테스트 시나리오

### 1. 기본 사용자 플로우 테스트

1. `user@test.com`으로 로그인
2. `/app` 페이지에서 대시보드 확인
3. 플랜 정보 및 엔타이틀 확인
4. 설정 페이지에서 프로필 수정
5. 로그아웃

### 2. 관리자 플로우 테스트

1. `admin@test.com`으로 로그인
2. `/admin` 페이지 접근
3. 사용자 관리 기능 테스트
4. 결제 관리 기능 테스트
5. 조직 관리 기능 테스트

### 3. 권한 테스트

1. 일반 사용자로 `/admin` 접근 시도 → 리디렉션 확인
2. 관리자로 `/admin` 접근 → 정상 접근 확인
3. 소유자로 모든 관리 기능 접근 → 정상 동작 확인

### 4. 플랜별 기능 테스트

1. Free 플랜 사용자로 제한된 기능 확인
2. Pro 플랜 사용자로 고급 기능 확인
3. Team 플랜 사용자로 모든 기능 확인

## 문제 해결

### 테스트 모드가 활성화되지 않는 경우

1. 환경변수 확인:
   ```bash
   echo $NEXT_PUBLIC_TEST_MODE
   ```

2. `.env.local` 파일 확인:
   ```bash
   cat apps/web/.env.local | grep TEST_MODE
   ```

3. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

### 로그인이 실패하는 경우

1. 브라우저 개발자 도구에서 Network 탭 확인
2. API 응답 상태 코드 확인
3. 콘솔 오류 메시지 확인

### 권한 오류가 발생하는 경우

1. 사용자 역할 확인
2. 세션 정보 확인
3. 미들웨어 설정 확인

## 보안 고려사항

### 개발 환경에서만 사용

- 테스트 모드는 `NODE_ENV === 'development'`에서만 활성화
- 프로덕션 환경에서는 자동으로 비활성화

### 테스트 데이터 보호

- 테스트 사용자 정보는 하드코딩되어 있음
- 실제 프로덕션 데이터와 분리되어 있음

### 세션 관리

- 테스트 모드에서는 간단한 쿠키 기반 세션 사용
- 실제 OAuth 세션과는 별도로 관리

## 확장 가능성

### 새로운 테스트 사용자 추가

`lib/test-mode.ts` 파일에서 `TEST_USERS` 객체에 새로운 사용자 추가:

```typescript
export const TEST_USERS: Record<string, TestUser> = {
  // 기존 사용자들...
  'newuser@test.com': {
    id: 'test-user-006',
    email: 'newuser@test.com',
    name: '새로운 사용자',
    role: 'USER',
    plan: 'free',
    status: 'ACTIVE'
  }
}
```

### 새로운 역할 추가

1. `TestUser` 타입에 새로운 역할 추가
2. `TestMode.hasPermission` 함수에 권한 로직 추가
3. 테스트 사용자에 새로운 역할 할당

### 새로운 플랜 추가

1. `TestUser` 타입에 새로운 플랜 추가
2. `lib/entitlements.ts`에 새로운 플랜 엔타이틀 추가
3. 테스트 사용자에 새로운 플랜 할당

## 결론

테스트 모드를 통해 OAuth Provider 설정 없이도 다양한 사용자 시나리오를 테스트할 수 있습니다. 개발 환경에서만 활성화되므로 안전하게 사용할 수 있으며, 실제 프로덕션 환경에는 영향을 주지 않습니다.
