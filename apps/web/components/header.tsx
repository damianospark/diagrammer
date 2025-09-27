'use client'

import { Button } from '@/components/ui/button'
import { Sun, Languages } from 'lucide-react'
import { useI18n } from '@/hooks/i18n'
import { useTheme } from '@/hooks/theme'

export function Header() {
  const { t, locale, setLocale } = useI18n()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button space */}
          <div className="w-10 md:w-0" />
          <h1 className="text-lg font-semibold text-foreground">
            {t('app_title')}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            aria-label={t(theme === 'dark' ? 'theme_light' : 'theme_dark')}
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
          >
            <Sun className="mr-2 h-4 w-4" />
            {theme === 'dark' ? t('theme_light') : t('theme_dark')}
          </Button>
          <Button
            aria-label={t('lang_korean') + '/' + t('lang_english')}
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
          >
            <Languages className="mr-2 h-4 w-4" />
            {locale === 'ko' ? t('lang_korean') : t('lang_english')}
          </Button>
        </div>
      </div>
    </header>
  )
}
