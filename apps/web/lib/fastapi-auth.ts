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
  }

  private setToken(token: string | null) {
    if (typeof window === 'undefined') return
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
    this.token = token
  }

  async login(email: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const data: LoginResponse = await response.json()

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
    return this.token
  }

  getUser(): User | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user
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
    if (fastapiAuth.getToken()) {
      fastapiAuth.verifyToken().then(isValid => {
        if (!isValid) {
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
          })
        } else {
          setAuthState(prev => ({
            ...prev,
            user: fastapiAuth.getUser(),
            isLoading: false,
          }))
        }
      })
    } else {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }))
    }
  }, [])

  return {
    ...authState,
    mounted,
    login,
    logout,
    refreshUser,
    isAuthenticated: mounted ? fastapiAuth.isAuthenticated() : false,
    hasRole: fastapiAuth.hasRole.bind(fastapiAuth),
    hasPlan: fastapiAuth.hasPlan.bind(fastapiAuth),
    fetchWithAuth: fastapiAuth.fetchWithAuth.bind(fastapiAuth),
  }
}
