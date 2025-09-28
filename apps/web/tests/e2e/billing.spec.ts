import { test, expect } from '@playwright/test'

test.describe('Billing and Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock 로그인된 사용자
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
  })

  test('should display pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // 플랜들이 표시되는지 확인
    await expect(page.locator('text=Free')).toBeVisible()
    await expect(page.locator('text=Pro')).toBeVisible()
    await expect(page.locator('text=Team')).toBeVisible()

    // 가격이 표시되는지 확인
    await expect(page.locator('text=₩0')).toBeVisible()
    await expect(page.locator('text=₩15,000')).toBeVisible()
    await expect(page.locator('text=₩49,000')).toBeVisible()
  })

  test('should create checkout session', async ({ page }) => {
    // Mock Stripe Checkout 세션 생성
    await page.route('**/api/checkout/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://checkout.stripe.com/test-session'
        })
      })
    })

    await page.goto('/pricing')
    await page.click('text=Pro 시작하기')

    // Checkout 세션 생성 API 호출 확인
    await expect(page).toHaveURL('https://checkout.stripe.com/test-session')
  })

  test('should display subscription status in settings', async ({ page }) => {
    // Mock 구독 정보
    await page.route('**/api/billing/subscription', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'FREE',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      })
    })

    await page.goto('/settings')

    // 구독 정보가 표시되는지 확인
    await expect(page.locator('text=현재 플랜')).toBeVisible()
    await expect(page.locator('text=Free 플랜을 사용 중입니다')).toBeVisible()
  })

  test('should create Stripe Portal session', async ({ page }) => {
    // Mock Stripe Portal 세션 생성
    await page.route('**/api/stripe/portal', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://billing.stripe.com/test-portal'
        })
      })
    })

    await page.goto('/settings')
    await page.click('text=결제 관리')

    // Portal 세션 생성 확인
    await expect(page).toHaveURL('https://billing.stripe.com/test-portal')
  })

  test('should handle webhook events', async ({ page }) => {
    // Mock 웹훅 이벤트 처리
    await page.route('**/api/stripe/webhook', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ received: true })
      })
    })

    // 웹훅 엔드포인트 테스트
    const response = await page.request.post('/api/stripe/webhook', {
      data: {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            client_reference_id: 'test-user',
            customer: 'cus_test_123'
          }
        }
      }
    })

    expect(response.status()).toBe(200)
  })

  test('should enforce plan limits', async ({ page }) => {
    // Mock Free 플랜 사용자
    await page.route('**/api/user/entitlements', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'free',
          sessions: 2,
          messagesPerDay: 100,
          maxNodes: 100,
          exports: ['png'],
          publicShare: false
        })
      })
    })

    await page.goto('/app')

    // 플랜 제한이 표시되는지 확인
    await expect(page.locator('text=2개 세션 저장')).toBeVisible()
    await expect(page.locator('text=일일 100개 메시지')).toBeVisible()
  })

  test('should show upgrade prompt for free users', async ({ page }) => {
    // Mock Free 플랜 사용자
    await page.route('**/api/user/entitlements', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'free',
          sessions: 2,
          messagesPerDay: 100,
          maxNodes: 100
        })
      })
    })

    await page.goto('/app')

    // 업그레이드 안내가 표시되는지 확인
    await expect(page.locator('text=더 많은 기능을 원하시나요?')).toBeVisible()
    await expect(page.locator('text=플랜 비교하기')).toBeVisible()
  })
})
