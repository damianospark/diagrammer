"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/fastapi-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/hooks/i18n"
import { useTheme } from "@/hooks/theme"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Sparkles,
  Menu,
  User,
  Settings,
  LogOut,
  CreditCard,
  Shield,
  Home,
  BarChart3,
  TestTube,
  Crown,
  Sun,
  Languages
} from "lucide-react"

export function GlobalHeader() {
  const { user, isAuthenticated, mounted, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, locale, setLocale } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center px-4">
        {/* 로고 */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Sparkles className="h-6 w-6" />
            <span className="font-bold">Diagrammer</span>
          </Link>
        </div>

        {/* 데스크톱 네비게이션 */}
        <div className="hidden md:flex flex-1 items-center justify-between">
          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                }`}
            >
              홈
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/pricing' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                }`}
            >
              요금제
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/app"
                  className={`text-sm font-medium transition-colors hover:text-primary ${pathname.startsWith('/app') ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                    }`}
                >
                  앱
                </Link>
                <Link
                  href="/settings"
                  className={`text-sm font-medium transition-colors hover:text-primary ${pathname.startsWith('/settings') ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                    }`}
                >
                  설정
                </Link>
                {user?.role === 'ADMIN' || user?.role === 'OWNER' ? (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium transition-colors hover:text-primary ${pathname.startsWith('/admin') ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                      }`}
                  >
                    관리자
                  </Link>
                ) : null}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-1">
            {/* 테마 및 언어 버튼 */}
            <Button
              aria-label={t(theme === 'dark' ? 'theme_light' : 'theme_dark')}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleTheme}
            >
              <Sun className="h-4 w-4" />
            </Button>
            <Button
              aria-label={t('lang_korean') + '/' + t('lang_english')}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
            >
              <Languages className="h-4 w-4" />
              <span className="ml-1 text-xs">{locale === 'ko' ? '한' : 'EN'}</span>
            </Button>

            {mounted && (
              <>
                {isAuthenticated ? (
                  <DropdownMenu className="h-8 px-2">
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 px-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3" />
                          </div>
                          <div className="hidden lg:block text-left">
                            <div className="text-sm font-medium">{user?.name}</div>
                            <div className="text-xs text-muted-foreground">{user?.plan}</div>
                          </div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{user?.name}</p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/app">
                          <Home className="mr-2 h-4 w-4" />
                          앱으로 이동
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          설정
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings?tab=billing">
                          <CreditCard className="mr-2 h-4 w-4" />
                          청구 정보
                        </Link>
                      </DropdownMenuItem>
                      {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Crown className="mr-2 h-4 w-4" />
                            관리자 패널
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">로그인</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/app">시작하기</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <div className="flex md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                <Link
                  href="/"
                  className="text-lg font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  홈
                </Link>
                <Link
                  href="/pricing"
                  className="text-lg font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  요금제
                </Link>

                {mounted && isAuthenticated && (
                  <>
                    <Link
                      href="/app"
                      className="text-lg font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      앱
                    </Link>
                    <Link
                      href="/settings"
                      className="text-lg font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      설정
                    </Link>
                    {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                      <Link
                        href="/admin"
                        className="text-lg font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        관리자
                      </Link>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user?.name}</div>
                          <div className="text-xs text-muted-foreground">{user?.email}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </Button>
                    </div>
                  </>
                )}

                {mounted && !isAuthenticated && (
                  <div className="pt-4 border-t space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        로그인
                      </Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/app" onClick={() => setIsMobileMenuOpen(false)}>
                        시작하기
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
