"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Theme = "light" | "dark"
type ChartTheme = "default" | "dark" | "light" | "blue" | "green" | "purple"

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  chartTheme: ChartTheme
  setChartTheme: (t: ChartTheme) => void
}

const THEME_KEY = "diagrammer_theme"
const CHART_THEME_KEY = "diagrammer_chart_theme"

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [chartTheme, setChartThemeState] = useState<ChartTheme>("default")

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem(THEME_KEY) as Theme)) || null
    if (saved === "light" || saved === "dark") {
      setThemeState(saved)
    }

    const savedChartTheme = (typeof window !== "undefined" && (localStorage.getItem(CHART_THEME_KEY) as ChartTheme)) || null
    if (savedChartTheme && ["default", "dark", "light", "blue", "green", "purple"].includes(savedChartTheme)) {
      setChartThemeState(savedChartTheme)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      if (theme === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, t)
  }

  const setChartTheme = (t: ChartTheme) => {
    setChartThemeState(t)
    if (typeof window !== "undefined") localStorage.setItem(CHART_THEME_KEY, t)
  }

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, chartTheme, setChartTheme }), [theme, chartTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
