/**
 * FastAPI 인증 클라이언트
 * FastAPI 백엔드의 JWT 기반 인증을 사용
 */

// React import (useAuth 훅에서 사용)
import * as React from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface User {
  id: string
  email: string
  name: string
  image?: string
  role: 'USER' | 'ADMIN' | 'OWNER'
  plan: 'free' | 'pro' | 'team'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

class FastAPIAuth {
  private token: string | null = null
  private user: User | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
      this.user = this.getStoredUser()
    }
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  }

  private setStoredUser(user: User | null) {
    if (typeof window === 'undefined') return
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_user')
    }
    this.user = user

    // 인증 상태 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { token: this.token, user }
    }))
  }

  private setToken(token: string | null) {
    if (typeof window === 'undefined') return
    if (token) {
      localStorage.setItem('auth_token', token)
      // 쿠키에도 저장 (미들웨어에서 확인용)
      document.cookie = `auth_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
    } else {
      localStorage.removeItem('auth_token')
      // 쿠키 삭제
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    this.token = token

    // 인증 상태 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { token, user: this.user }
    }))
  }

  async login(email: string): Promise<LoginResponse> {
    console.log('FastAPI Auth: Attempting login for:', email)
    console.log('API_BASE_URL:', API_BASE_URL)

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    console.log('Login response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('Login error:', error)
      throw new Error(error.detail || 'Login failed')
    }

    const data: LoginResponse = await response.json()
    console.log('Login response data:', data)

    this.setToken(data.access_token)
    this.setStoredUser(data.user)
    this.user = data.user

    return data
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.setToken(null)
      this.setStoredUser(null)
      this.user = null
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰이 만료되었거나 유효하지 않음
          this.logout()
          return null
        }
        throw new Error('Failed to get user')
      }

      const user: User = await response.json()
      this.setStoredUser(user)
      this.user = user
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      this.logout()
      return null
    }
  }

  // Next.js API 호출을 위한 헬퍼 메서드
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token')
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async verifyToken(): Promise<boolean> {
    if (!this.token) return false

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        this.user = data.user
        this.setStoredUser(data.user)
        return true
      } else {
        this.logout()
        return false
      }
    } catch (error) {
      console.error('Token verification error:', error)
      this.logout()
      return false
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    // localStorage에서 최신 토큰 확인
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken && storedToken !== this.token) {
      this.token = storedToken
    }
    return this.token
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null
    // localStorage에서 최신 사용자 정보 확인
    const storedUser = this.getStoredUser()
    if (storedUser && (!this.user || storedUser.id !== this.user.id)) {
      this.user = storedUser
    }
    return this.user
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    const user = this.getUser()
    return !!token && !!user
  }

  hasRole(role: 'USER' | 'ADMIN' | 'OWNER'): boolean {
    if (!this.user) return false

    const roleHierarchy = { 'USER': 1, 'ADMIN': 2, 'OWNER': 3 }
    const userLevel = roleHierarchy[this.user.role] || 0
    const requiredLevel = roleHierarchy[role] || 0

    return userLevel >= requiredLevel
  }

  hasPlan(plan: 'free' | 'pro' | 'team'): boolean {
    if (!this.user) return false

    const planHierarchy = { 'free': 1, 'pro': 2, 'team': 3 }
    const userLevel = planHierarchy[this.user.plan] || 0
    const requiredLevel = planHierarchy[plan] || 0

    return userLevel >= requiredLevel
  }

  async getTestUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/auth/users`)

    if (!response.ok) {
      throw new Error('Failed to get test users')
    }

    const data = await response.json()
    return data.users
  }
}

// 싱글톤 인스턴스
export const fastapiAuth = new FastAPIAuth()

// 서버사이드에서 사용할 수 있는 getCurrentUser 함수
export const getCurrentUser = async (): Promise<User | null> => {
  // 서버사이드에서는 쿠키에서 토큰을 읽어야 함
  if (typeof window === 'undefined') {
    // 서버사이드에서는 쿠키를 직접 읽을 수 없으므로 null 반환
    // 클라이언트사이드에서 인증 확인하도록 함
    return null
  }
  return await fastapiAuth.getCurrentUser()
}

// React Hook
export function useAuth() {
  const [mounted, setMounted] = React.useState(false)
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  const login = async (email: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    try {
      const result = await fastapiAuth.login(email)
      console.log('useAuth: Login successful, setting auth state:', {
        user: result.user,
        hasToken: !!result.access_token
      })
      setAuthState({
        user: result.user,
        token: result.access_token,
        isLoading: false,
      })
      return result
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    await fastapiAuth.logout()
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
    })
  }

  const refreshUser = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    try {
      const user = await fastapiAuth.getCurrentUser()
      setAuthState(prev => ({
        ...prev,
        user,
        isLoading: false,
      }))
      return user
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  React.useEffect(() => {
    // 클라이언트 마운트 완료
    setMounted(true)

    // 컴포넌트 마운트 시 토큰 검증
    const token = fastapiAuth.getToken()
    const user = fastapiAuth.getUser()
    console.log('useAuth: Initial token check:', token ? 'exists' : 'none')
    console.log('useAuth: Initial user check:', user ? 'exists' : 'none')

    if (token && user) {
      // 토큰과 사용자 정보가 모두 있으면 즉시 인증 상태 설정
      console.log('useAuth: Setting auth state from stored data:', { user, token })
      setAuthState({
        user,
        token,
        isLoading: false,
      })

      // 백그라운드에서 토큰 검증
      fastapiAuth.verifyToken().then(isValid => {
        console.log('useAuth: Token validation result:', isValid)
        if (!isValid) {
          console.log('useAuth: Token invalid, clearing auth state')
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
          })
        }
      }).catch(error => {
        console.error('useAuth: Token validation error:', error)
        // 네트워크 오류 등으로 검증 실패해도 기존 상태 유지
        console.log('useAuth: Keeping existing auth state due to validation error')
      })
    } else if (token) {
      // 토큰만 있고 사용자 정보가 없는 경우
      fastapiAuth.verifyToken().then(isValid => {
        console.log('useAuth: Token validation result:', isValid)
        if (!isValid) {
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
          })
        } else {
          const user = fastapiAuth.getUser()
          console.log('useAuth: Setting user from token:', user)
          setAuthState({
            user,
            token,
            isLoading: false,
          })
        }
      }).catch(error => {
        console.error('useAuth: Token validation error:', error)
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
        })
      })
    } else {
      console.log('useAuth: No token found, setting loading to false')
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }))
    }

    // 인증 상태 변경 이벤트 감지
    const handleAuthStateChange = (e: CustomEvent) => {
      console.log('useAuth: Auth state changed event received:', e.detail)
      const { token, user } = e.detail
      setAuthState({
        user,
        token,
        isLoading: false,
      })
    }

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener)
    return () => window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener)
  }, [])

  const isAuthenticated = mounted ? !!(authState.user && authState.token) : false

  console.log('useAuth: Returning state:', {
    mounted,
    isAuthenticated,
    user: authState.user,
    hasToken: !!authState.token,
    isLoading: authState.isLoading,
    authStateUser: authState.user,
    authStateToken: authState.token
  })

  return {
    user: authState.user,
    token: authState.token,
    isLoading: authState.isLoading,
    mounted,
    login,
    logout,
    refreshUser,
    isAuthenticated,
    hasRole: fastapiAuth.hasRole.bind(fastapiAuth),
    hasPlan: fastapiAuth.hasPlan.bind(fastapiAuth),
    fetchWithAuth: fastapiAuth.fetchWithAuth.bind(fastapiAuth),
  }
}
