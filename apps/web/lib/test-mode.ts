/**
 * 테스트 모드 설정 및 관리
 * OAuth 없이 미리 정의된 테스트 사용자로 로그인할 수 있도록 함
 */

export interface TestUser {
  id: string
  email: string
  name: string
  image?: string
  role: 'USER' | 'ADMIN' | 'OWNER'
  plan: 'free' | 'pro' | 'team'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

// 테스트 모드 활성화 여부
export const TEST_MODE_ENABLED = process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_TEST_MODE === 'true'

// 미리 정의된 테스트 사용자들
export const TEST_USERS: Record<string, TestUser> = {
  // 일반 사용자 (Free 플랜)
  'user@test.com': {
    id: 'test-user-001',
    email: 'user@test.com',
    name: '테스트 사용자',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    role: 'USER',
    plan: 'free',
    status: 'ACTIVE'
  },

  // Pro 플랜 사용자
  'pro@test.com': {
    id: 'test-user-002',
    email: 'pro@test.com',
    name: 'Pro 사용자',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro',
    role: 'USER',
    plan: 'pro',
    status: 'ACTIVE'
  },

  // Team 플랜 사용자
  'team@test.com': {
    id: 'test-user-003',
    email: 'team@test.com',
    name: 'Team 사용자',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=team',
    role: 'USER',
    plan: 'team',
    status: 'ACTIVE'
  },

  // 관리자
  'admin@test.com': {
    id: 'test-admin-001',
    email: 'admin@test.com',
    name: '관리자',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'ADMIN',
    plan: 'pro',
    status: 'ACTIVE'
  },

  // 소유자
  'owner@test.com': {
    id: 'test-owner-001',
    email: 'owner@test.com',
    name: '소유자',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
    role: 'OWNER',
    plan: 'team',
    status: 'ACTIVE'
  },

  // 비활성 사용자
  'inactive@test.com': {
    id: 'test-user-004',
    email: 'inactive@test.com',
    name: '비활성 사용자',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=inactive',
    role: 'USER',
    plan: 'free',
    status: 'INACTIVE'
  },

  // 정지된 사용자
  'suspended@test.com': {
    id: 'test-user-005',
    email: 'suspended@test.com',
    name: '정지된 사용자',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suspended',
    role: 'USER',
    plan: 'free',
    status: 'SUSPENDED'
  }
}

// 테스트 모드에서 사용할 기본 사용자
export const DEFAULT_TEST_USER = TEST_USERS['user@test.com']

// 테스트 모드 헬퍼 함수들
export const TestMode = {
  /**
   * 테스트 모드가 활성화되어 있는지 확인
   */
  isEnabled(): boolean {
    return TEST_MODE_ENABLED
  },

  /**
   * 테스트 사용자 목록 반환
   */
  getUsers(): TestUser[] {
    return Object.values(TEST_USERS)
  },

  /**
   * 이메일로 테스트 사용자 찾기
   */
  getUserByEmail(email: string): TestUser | null {
    return TEST_USERS[email] || null
  },

  /**
   * 역할별 테스트 사용자 필터링
   */
  getUsersByRole(role: TestUser['role']): TestUser[] {
    return Object.values(TEST_USERS).filter(user => user.role === role)
  },

  /**
   * 플랜별 테스트 사용자 필터링
   */
  getUsersByPlan(plan: TestUser['plan']): TestUser[] {
    return Object.values(TEST_USERS).filter(user => user.plan === plan)
  },

  /**
   * 상태별 테스트 사용자 필터링
   */
  getUsersByStatus(status: TestUser['status']): TestUser[] {
    return Object.values(TEST_USERS).filter(user => user.status === status)
  },

  /**
   * 테스트 사용자 존재 여부 확인
   */
  userExists(email: string): boolean {
    return email in TEST_USERS
  },

  /**
   * 테스트 사용자 권한 확인
   */
  hasPermission(user: TestUser, permission: string): boolean {
    switch (permission) {
      case 'admin.access':
        return user.role === 'ADMIN' || user.role === 'OWNER'
      case 'user.manage':
        return user.role === 'OWNER'
      case 'billing.manage':
        return user.role === 'ADMIN' || user.role === 'OWNER'
      case 'organization.manage':
        return user.role === 'ADMIN' || user.role === 'OWNER'
      default:
        return user.status === 'ACTIVE'
    }
  }
}

// 테스트 모드에서 사용할 세션 데이터 생성
export function createTestSession(user: TestUser) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일
  }
}

// 테스트 모드에서 사용할 JWT 토큰 생성 (Auth.js 호환)
export function createTestToken(user: TestUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.image,
    role: user.role,
    plan: user.plan,
    status: user.status,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30일
    jti: `test-${user.id}-${Date.now()}`
  }

  // Auth.js JWT 형식에 맞춘 base64 인코딩
  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = Buffer.from('test-signature').toString('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

// 테스트 모드에서 사용할 쿠키 설정
export function setTestModeCookie(user: TestUser): string {
  const token = createTestToken(user)
  return `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
}
