
'use client'

import React, { useContext } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...newToast, id }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[2000] flex w-full max-w-xs flex-col gap-3 sm:max-w-sm">
        {toasts.map((toastItem) => {
          const isDestructive = toastItem.variant === 'destructive'
          return (
            <div
              key={toastItem.id}
              className={cn(
                'pointer-events-auto overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 ease-out animate-[toast-in_0.4s_ease-out]',
                isDestructive
                  ? 'border-red-300/60 bg-white/96 text-red-600 shadow-red-200/40 dark:border-red-500/30 dark:bg-slate-900/92 dark:text-red-200'
                  : 'border-slate-200/70 bg-white/96 text-slate-900 shadow-slate-200/50 dark:border-slate-700/60 dark:bg-slate-900/92 dark:text-slate-100'
              )}
              role="status"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  {isDestructive ? (
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold tracking-tight">{toastItem.title}</p>
                  {toastItem.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{toastItem.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="닫기"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300/80 bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => dismiss(toastItem.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
