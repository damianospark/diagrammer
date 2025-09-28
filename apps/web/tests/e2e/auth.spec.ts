import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await page.click('text=로그인')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('로그인')
  })

  test('should show OAuth providers', async ({ page }) => {
    await page.goto('/login')

    // OAuth 버튼들이 표시되는지 확인
    await expect(page.locator('text=Google로 시작하기')).toBeVisible()
    await expect(page.locator('text=GitHub로 시작하기')).toBeVisible()
    await expect(page.locator('text=Facebook으로 시작하기')).toBeVisible()
  })

  test('should redirect to settings after login', async ({ page }) => {
    // Mock OAuth 로그인
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
          }
        })
      })
    })

    await page.goto('/settings')
    await expect(page.locator('h1')).toContainText('설정')
  })

  test('should protect admin routes', async ({ page }) => {
    // 비로그인 상태에서 admin 접근 시도
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('should allow admin access with proper role', async ({ page }) => {
    // Mock admin 사용자
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-user',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN'
          }
        })
      })
    })

    await page.goto('/admin')
    await expect(page.locator('h1')).toContainText('관리자 대시보드')
  })
})
