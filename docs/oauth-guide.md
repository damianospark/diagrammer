# OAuth Provider 설정 가이드

## 개요

Diagrammer SaaS 사이트에서 OAuth 로그인을 활성화하기 위한 상세 설정 가이드입니다. Google, Facebook, GitHub, Kakao, Naver OAuth Provider를 설정하는 방법을 다룹니다.

## 사전 준비사항

- 도메인: `https://diagrammer.realstory.blog` (프로덕션) 또는 `http://localhost:3000` (개발)
- OAuth Provider 계정 (Google, Facebook, GitHub, Kakao, Naver)
- 환경변수 파일: `apps/web/.env.local`

## 1. Google OAuth 설정

### 1.1 Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - Google 계정으로 로그인

2. **프로젝트 생성 또는 선택**
   - 새 프로젝트 생성 또는 기존 프로젝트 선택
   - 프로젝트 이름: `Diagrammer SaaS`

3. **OAuth 2.0 클라이언트 ID 생성**
   - 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
   - "사용자 인증 정보 만들기" → "OAuth 2.0 클라이언트 ID"
   - 애플리케이션 유형: "웹 애플리케이션"

4. **승인된 JavaScript 원본**
   ```
   http://localhost:3000
   https://diagrammer.realstory.blog
   ```

5. **승인된 리디렉션 URI**
   ```
   http://localhost:3000/api/auth/callback/google
   https://diagrammer.realstory.blog/api/auth/callback/google
   ```

6. **클라이언트 ID 및 시크릿 복사**
   - 클라이언트 ID: `123456789-abcdefg.apps.googleusercontent.com`
   - 클라이언트 시크릿: `GOCSPX-abcdefghijklmnop`

### 1.2 환경변수 설정

`apps/web/.env.local` 파일에 추가:

```bash
AUTH_GOOGLE_ID="123456789-abcdefg.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-abcdefghijklmnop"
```

## 2. Facebook OAuth 설정

### 2.1 Facebook Developers 설정

1. **Facebook Developers 접속**
   - https://developers.facebook.com/ 접속
   - Facebook 계정으로 로그인

2. **앱 생성**
   - "내 앱" → "앱 만들기"
   - 앱 유형: "비즈니스"
   - 앱 이름: `Diagrammer SaaS`

3. **Facebook 로그인 설정**
   - 좌측 메뉴 → "Facebook 로그인" → "설정"
   - "유효한 OAuth 리디렉션 URI"에 추가:
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://diagrammer.realstory.blog/api/auth/callback/facebook
   ```

4. **앱 ID 및 앱 시크릿 복사**
   - 앱 ID: `1234567890123456`
   - 앱 시크릿: `abcdefghijklmnopqrstuvwxyz123456`

### 2.2 환경변수 설정

`apps/web/.env.local` 파일에 추가:

```bash
AUTH_FACEBOOK_ID="1234567890123456"
AUTH_FACEBOOK_SECRET="abcdefghijklmnopqrstuvwxyz123456"
```

## 3. GitHub OAuth 설정

### 3.1 GitHub Developer Settings

1. **GitHub Settings 접속**
   - https://github.com/settings/developers 접속
   - GitHub 계정으로 로그인

2. **OAuth App 생성**
   - "OAuth Apps" → "New OAuth App"
   - Application name: `Diagrammer SaaS`
   - Homepage URL: `https://diagrammer.realstory.blog`
   - Authorization callback URL:
   ```
   http://localhost:3000/api/auth/callback/github
   https://diagrammer.realstory.blog/api/auth/callback/github
   ```

3. **Client ID 및 Client Secret 복사**
   - Client ID: `Ov23liAbCdEfGhIjKlMn`
   - Client Secret: `abcdefghijklmnopqrstuvwxyz1234567890`

### 3.2 환경변수 설정

`apps/web/.env.local` 파일에 추가:

```bash
AUTH_GITHUB_ID="Ov23liAbCdEfGhIjKlMn"
AUTH_GITHUB_SECRET="abcdefghijklmnopqrstuvwxyz1234567890"
```

## 4. Kakao OAuth 설정

### 4.1 Kakao Developers 설정

1. **Kakao Developers 접속**
   - https://developers.kakao.com/ 접속
   - 카카오 계정으로 로그인

2. **애플리케이션 생성**
   - "내 애플리케이션" → "애플리케이션 추가하기"
   - 앱 이름: `Diagrammer SaaS`
   - 사업자명: `RealStory`

3. **플랫폼 설정**
   - "플랫폼" → "Web 플랫폼 등록"
   - 사이트 도메인: `https://diagrammer.realstory.blog`

4. **카카오 로그인 설정**
   - "카카오 로그인" → "활성화 설정" → "활성화"
   - Redirect URI 등록:
   ```
   http://localhost:3000/api/auth/callback/kakao
   https://diagrammer.realstory.blog/api/auth/callback/kakao
   ```

5. **동의항목 설정**
   - "카카오 로그인" → "동의항목"
   - 필수 동의: 닉네임, 프로필 사진
   - 선택 동의: 이메일 주소

6. **REST API 키 및 Client Secret 복사**
   - REST API 키: `abcdefghijklmnopqrstuvwxyz123456`
   - Client Secret: `abcdefghijklmnopqrstuvwxyz1234567890`

### 4.2 환경변수 설정

`apps/web/.env.local` 파일에 추가:

```bash
AUTH_KAKAO_ID="abcdefghijklmnopqrstuvwxyz123456"
AUTH_KAKAO_SECRET="abcdefghijklmnopqrstuvwxyz1234567890"
```

## 5. Naver OAuth 설정

### 5.1 Naver Developers 설정

1. **Naver Developers 접속**
   - https://developers.naver.com/ 접속
   - 네이버 계정으로 로그인

2. **애플리케이션 등록**
   - "Application" → "애플리케이션 등록"
   - 애플리케이션 이름: `Diagrammer SaaS`
   - 사용 API: "네이버 로그인"

3. **서비스 환경 설정**
   - PC 웹: `https://diagrammer.realstory.blog`
   - 모바일 웹: `https://diagrammer.realstory.blog`

4. **Callback URL 설정**
   ```
   http://localhost:3000/api/auth/callback/naver
   https://diagrammer.realstory.blog/api/auth/callback/naver
   ```

5. **Client ID 및 Client Secret 복사**
   - Client ID: `abcdefghijklmnopqrstuvwxyz123456`
   - Client Secret: `abcdefghijklmnopqrstuvwxyz1234567890`

### 5.2 환경변수 설정

`apps/web/.env.local` 파일에 추가:

```bash
AUTH_NAVER_ID="abcdefghijklmnopqrstuvwxyz123456"
AUTH_NAVER_SECRET="abcdefghijklmnopqrstuvwxyz1234567890"
```

## 6. AUTH_SECRET 생성

### 6.1 AUTH_SECRET 생성 방법

```bash
# 방법 1: OpenSSL 사용
openssl rand -base64 32

# 방법 2: Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 방법 3: 온라인 생성기
# https://generate-secret.vercel.app/32
```

### 6.2 환경변수 설정

`apps/web/.env.local` 파일에 추가:

```bash
AUTH_SECRET="your-generated-secret-key-here-32-characters-long"
AUTH_URL="http://localhost:3000"
```

## 7. 완성된 환경변수 파일 예시

`apps/web/.env.local`:

```bash
# --- 데이터베이스 ---
DATABASE_URL="postgresql://diagrammer:diagrammer123@localhost:5432/diagrammer"

# --- Auth.js v5 / OAuth ---
AUTH_SECRET="your-generated-secret-key-here-32-characters-long"
AUTH_URL="http://localhost:3000"

# --- OAuth Providers ---
AUTH_GOOGLE_ID="123456789-abcdefg.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-abcdefghijklmnop"

AUTH_FACEBOOK_ID="1234567890123456"
AUTH_FACEBOOK_SECRET="abcdefghijklmnopqrstuvwxyz123456"

AUTH_GITHUB_ID="Ov23liAbCdEfGhIjKlMn"
AUTH_GITHUB_SECRET="abcdefghijklmnopqrstuvwxyz1234567890"

AUTH_KAKAO_ID="abcdefghijklmnopqrstuvwxyz123456"
AUTH_KAKAO_SECRET="abcdefghijklmnopqrstuvwxyz1234567890"

AUTH_NAVER_ID="abcdefghijklmnopqrstuvwxyz123456"
AUTH_NAVER_SECRET="abcdefghijklmnopqrstuvwxyz1234567890"

# --- Stripe ---
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
STRIPE_PRICE_PRO_MONTHLY="price_your_pro_monthly_price_id"
STRIPE_PRICE_TEAM_MONTHLY="price_your_team_monthly_price_id"
STRIPE_PORTAL_RETURN_URL="http://localhost:3000/settings"

# --- Public ---
NEXT_PUBLIC_APP_NAME="Diagrammer"
NEXT_PUBLIC_PRIMARY_DOMAIN="http://localhost:3000"
NEXT_PUBLIC_APP_DOMAIN="http://localhost:3000/app"
```

## 8. 테스트 방법

### 8.1 개발 서버 재시작

```bash
cd apps/web
npm run dev
```

### 8.2 OAuth 로그인 테스트

1. **브라우저에서 접속**
   - http://localhost:3000 접속
   - "Google로 시작하기" 버튼 클릭

2. **OAuth 플로우 확인**
   - Google 로그인 페이지로 리디렉션
   - 계정 선택 및 권한 승인
   - 앱으로 리디렉션

3. **로그인 성공 확인**
   - 사용자 정보가 표시되는지 확인
   - `/app` 페이지로 이동 가능한지 확인

### 8.3 문제 해결

#### 일반적인 오류

1. **"Invalid redirect URI" 오류**
   - OAuth Provider 설정에서 Redirect URI 확인
   - 정확한 URL과 경로 입력

2. **"Invalid client" 오류**
   - Client ID와 Secret 확인
   - 환경변수 파일의 따옴표 확인

3. **"AUTH_SECRET not set" 오류**
   - AUTH_SECRET 환경변수 설정 확인
   - 32자 이상의 랜덤 문자열 사용

#### 디버깅 방법

```bash
# 환경변수 확인
cd apps/web
cat .env.local

# 개발 서버 로그 확인
npm run dev

# 브라우저 개발자 도구에서 Network 탭 확인
```

## 9. 프로덕션 배포 시 주의사항

### 9.1 도메인 변경

프로덕션 배포 시 모든 OAuth Provider 설정에서:
- `http://localhost:3000` → `https://diagrammer.realstory.blog`
- `http://localhost:3000/api/auth/callback/*` → `https://diagrammer.realstory.blog/api/auth/callback/*`

### 9.2 환경변수 업데이트

```bash
AUTH_URL="https://diagrammer.realstory.blog"
NEXT_PUBLIC_PRIMARY_DOMAIN="https://diagrammer.realstory.blog"
NEXT_PUBLIC_APP_DOMAIN="https://diagrammer.realstory.blog/app"
```

### 9.3 보안 강화

- AUTH_SECRET을 강력한 랜덤 문자열로 변경
- OAuth Provider에서 프로덕션 도메인만 허용
- HTTPS 사용 필수

## 10. 체크리스트

### 10.1 개발 환경 설정

- [ ] Google OAuth 설정 완료
- [ ] Facebook OAuth 설정 완료
- [ ] GitHub OAuth 설정 완료
- [ ] Kakao OAuth 설정 완료
- [ ] Naver OAuth 설정 완료
- [ ] AUTH_SECRET 생성 및 설정
- [ ] 환경변수 파일 완성
- [ ] 개발 서버 재시작
- [ ] OAuth 로그인 테스트

### 10.2 프로덕션 환경 설정

- [ ] 모든 OAuth Provider에서 프로덕션 도메인 설정
- [ ] 환경변수 프로덕션 값으로 업데이트
- [ ] HTTPS 설정 확인
- [ ] 프로덕션에서 OAuth 로그인 테스트

## 11. 추가 리소스

- [Auth.js 공식 문서](https://authjs.dev/)
- [Google OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Facebook 로그인 가이드](https://developers.facebook.com/docs/facebook-login/)
- [GitHub OAuth 가이드](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Kakao 로그인 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Naver 로그인 가이드](https://developers.naver.com/docs/login/api/)

---

이 가이드를 따라 OAuth Provider를 설정하면 Diagrammer SaaS 사이트에서 소셜 로그인이 정상적으로 작동합니다.
