import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
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
  })

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/admin')

    // 대시보드 요소들이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('관리자 대시보드')
    await expect(page.locator('text=총 사용자')).toBeVisible()
    await expect(page.locator('text=활성 사용자')).toBeVisible()
    await expect(page.locator('text=총 조직')).toBeVisible()
    await expect(page.locator('text=월 수익')).toBeVisible()
  })

  test('should display user management', async ({ page }) => {
    // Mock 사용자 데이터
    await page.route('**/api/admin/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'USER',
              status: 'ACTIVE',
              createdAt: new Date()
            }
          ]
        })
      })
    })

    await page.goto('/admin/users')

    // 사용자 관리 페이지 요소들이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('사용자 관리')
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=john@example.com')).toBeVisible()
  })

  test('should display organization management', async ({ page }) => {
    // Mock 조직 데이터
    await page.route('**/api/admin/organizations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          organizations: [
            {
              id: 'org-1',
              name: 'Test Organization',
              slug: 'test-org',
              status: 'ACTIVE',
              plan: 'PRO',
              memberCount: 5,
              createdAt: new Date()
            }
          ]
        })
      })
    })

    await page.goto('/admin/organizations')

    // 조직 관리 페이지 요소들이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('조직 관리')
    await expect(page.locator('text=Test Organization')).toBeVisible()
    await expect(page.locator('text=test-org')).toBeVisible()
  })

  test('should display billing management', async ({ page }) => {
    // Mock 결제 데이터
    await page.route('**/api/admin/billing', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptions: [
            {
              id: 'sub-1',
              userId: 'user-1',
              plan: 'PRO',
              status: 'ACTIVE',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              amount: 15000
            }
          ]
        })
      })
    })

    await page.goto('/admin/billing')

    // 결제 관리 페이지 요소들이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('결제 관리')
    await expect(page.locator('text=PRO')).toBeVisible()
    await expect(page.locator('text=ACTIVE')).toBeVisible()
  })

  test('should display audit logs', async ({ page }) => {
    // Mock 감사 로그 데이터
    await page.route('**/api/admin/audit', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [
            {
              id: 'log-1',
              action: 'user.created',
              resource: 'user',
              userId: 'user-1',
              createdAt: new Date(),
              user: {
                name: 'John Doe',
                email: 'john@example.com'
              }
            }
          ]
        })
      })
    })

    await page.goto('/admin/audit')

    // 감사 로그 페이지 요소들이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('감사 로그')
    await expect(page.locator('text=user.created')).toBeVisible()
    await expect(page.locator('text=John Doe')).toBeVisible()
  })

  test('should display feature flags', async ({ page }) => {
    // Mock 기능 플래그 데이터
    await page.route('**/api/admin/features', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          flags: [
            {
              id: 'flag-1',
              key: 'new-feature',
              name: 'New Feature',
              description: 'A new feature for testing',
              enabled: true,
              rollout: 50
            }
          ]
        })
      })
    })

    await page.goto('/admin/features')

    // 기능 플래그 페이지 요소들이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('기능 플래그')
    await expect(page.locator('text=New Feature')).toBeVisible()
    await expect(page.locator('text=50%')).toBeVisible()
  })

  test('should display integrations', async ({ page }) => {
    // Mock 통합 데이터
    await page.route('**/api/admin/integrations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          integrations: [
            {
              id: 'int-1',
              type: 'sso',
              name: 'SAML SSO',
              status: 'active',
              lastSync: new Date()
            }
          ]
        })
      })
    })

    await page.goto('/admin/integrations')

    // 통합 관리 페이지 요소들이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('통합 관리')
    await expect(page.locator('text=SAML SSO')).toBeVisible()
    await expect(page.locator('text=active')).toBeVisible()
  })

  test('should restrict access for non-admin users', async ({ page }) => {
    // Mock 일반 사용자
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Regular User',
            role: 'USER'
          }
        })
      })
    })

    await page.goto('/admin')

    // 일반 사용자는 admin에 접근할 수 없어야 함
    await expect(page).toHaveURL('/')
  })

  test('should allow owner-only features for owners', async ({ page }) => {
    // Mock 소유자 사용자
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'owner-1',
            email: 'owner@example.com',
            name: 'Owner User',
            role: 'OWNER'
          }
        })
      })
    })

    await page.goto('/admin/integrations')

    // 소유자는 모든 기능에 접근할 수 있어야 함
    await expect(page.locator('h1')).toContainText('통합 관리')
  })
})
