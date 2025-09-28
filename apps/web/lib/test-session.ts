/**
 * 테스트 모드 세션 관리
 * 클라이언트 사이드에서 테스트 모드 세션을 관리하는 유틸리티
 */

import { TestMode, type TestUser } from "./test-mode"

export interface TestSession {
  user: {
    id: string
    email: string
    name: string
    image?: string
  }
  expires: string
}

/**
 * 테스트 모드 세션 정보 가져오기
 */
export async function getTestSession(): Promise<TestSession | null> {
  if (!TestMode.isEnabled()) {
    return null
  }

  try {
    const response = await fetch("/api/test-mode/session", {
      credentials: "include"
    })

    if (response.ok) {
      const data = await response.json()
      return data.session
    }
  } catch (error) {
    console.error("Failed to fetch test session:", error)
  }

  return null
}

/**
 * 테스트 모드 로그인
 */
export async function loginTestUser(email: string): Promise<TestUser | null> {
  if (!TestMode.isEnabled()) {
    return null
  }

  try {
    const response = await fetch("/api/test-mode/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ email })
    })

    if (response.ok) {
      const data = await response.json()
      return data.user
    }
  } catch (error) {
    console.error("Failed to login test user:", error)
  }

  return null
}

/**
 * 테스트 모드 로그아웃
 */
export async function logoutTestUser(): Promise<boolean> {
  if (!TestMode.isEnabled()) {
    return false
  }

  try {
    const response = await fetch("/api/test-mode/logout", {
      method: "POST",
      credentials: "include"
    })

    return response.ok
  } catch (error) {
    console.error("Failed to logout test user:", error)
    return false
  }
}

/**
 * 테스트 모드 사용자 목록 가져오기
 */
export async function getTestUsers(filters?: {
  role?: string
  plan?: string
  status?: string
}): Promise<TestUser[]> {
  if (!TestMode.isEnabled()) {
    return []
  }

  try {
    const params = new URLSearchParams()
    if (filters?.role) params.append("role", filters.role)
    if (filters?.plan) params.append("plan", filters.plan)
    if (filters?.status) params.append("status", filters.status)

    const response = await fetch(`/api/test-mode/login?${params}`, {
      credentials: "include"
    })

    if (response.ok) {
      const data = await response.json()
      return data.users
    }
  } catch (error) {
    console.error("Failed to fetch test users:", error)
  }

  return []
}
