/**
 * useTheme.ts - Tema claro ou escuro, lembrado entre sessões
 * # Pra que serve?
 * - Respeitar a preferência do sistema operacional na primeira visita
 * - Guardar a escolha manual, que passa a valer por cima do sistema
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

/** Escolha salva; sem ela, o que o sistema operacional pede. */
function resolveInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark") return saved

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** Aplica no <html>, que é onde o Tailwind procura a classe .dark */
function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }, [])

  return { theme, setTheme, toggleTheme }
}

/** Chamado antes do React montar, pra tela não piscar branca antes de escurecer. */
export function initTheme() {
  applyTheme(resolveInitialTheme())
}
