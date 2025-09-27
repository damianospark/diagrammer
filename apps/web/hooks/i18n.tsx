"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Locale = "ko" | "en"

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18N_STORAGE_KEY = "diagrammer_locale"

const dictionary: Record<Locale, Record<string, string>> = {
  ko: {
    app_title: "AI 다이어그램 생성기",
    nav_home: "홈",
    nav_new_diagram: "새 다이어그램",
    nav_settings: "설정",
    provider: "프로바이더",
    lang_korean: "한국어",
    lang_english: "English",
    theme_light: "라이트 모드",
    theme_dark: "다크 모드",
    generate: "생성하기",
    generating: "생성 중...",
    export_png: "PNG 내보내기",
    preview: "미리보기",
    code: "코드",
    prompt_placeholder: "예시: 사용자 로그인 플로우 다이어그램을 생성해주세요",
    diagram_preview_placeholder: "다이어그램을 생성하면 여기에 표시됩니다",
    diagram_code_placeholder: "다이어그램을 생성하면 코드가 여기에 표시됩니다",
    engine_mermaid: "Mermaid",
    engine_visjs: "vis.js",
    provider_gemini: "Gemini",
    provider_mock: "Mock",
  },
  en: {
    app_title: "AI Diagram Generator",
    nav_home: "Home",
    nav_new_diagram: "New Diagram",
    nav_settings: "Settings",
    provider: "Provider",
    lang_korean: "Korean",
    lang_english: "English",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    generate: "Generate",
    generating: "Generating...",
    export_png: "Export PNG",
    preview: "Preview",
    code: "Code",
    prompt_placeholder: "Ex: Generate a user login flow diagram",
    diagram_preview_placeholder: "Your diagram will appear here",
    diagram_code_placeholder: "Generated code will appear here",
    engine_mermaid: "Mermaid",
    engine_visjs: "vis.js",
    provider_gemini: "Gemini",
    provider_mock: "Mock",
  },
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko")

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem(I18N_STORAGE_KEY) as Locale)) || null
    if (saved === "ko" || saved === "en") setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof window !== "undefined") localStorage.setItem(I18N_STORAGE_KEY, l)
  }

  const t = useMemo(() => {
    const d = dictionary[locale] || dictionary.ko
    return (key: string) => d[key] ?? key
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
