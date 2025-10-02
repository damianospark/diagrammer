'use client'

import { useEffect } from 'react'

export function ClientLogger() {
  useEffect(() => {
    // 클라이언트에서 로거 초기화
    import('@/lib/frontend-logger')
  }, [])

  return null
}