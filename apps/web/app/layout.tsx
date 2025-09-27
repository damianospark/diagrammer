import { Header } from '@/components/header'
import { SideNav } from '@/components/side-nav/SideNav'
import { I18nProvider } from '@/hooks/i18n'
import { ThemeProvider } from '@/hooks/theme'
import { ToastProvider } from '@/hooks/use-toast'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Diagrammer - AI 기반 다이어그램 생성',
  description: 'AI를 활용한 간편한 다이어그램 생성 및 편집 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <div className="flex h-screen bg-background">
                <SideNav />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-auto">
                    {children}
                  </main>
                </div>
              </div>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
