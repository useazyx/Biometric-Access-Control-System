/**
 * main.tsx - O ponto de entrada da aplicação
 * # Pra que serve?
 * - Aplicar o tema ANTES do React montar, pra tela não piscar branca no modo escuro
 * - Montar o App na raiz do documento
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-10): Primeira versão
 * - v2.0.0 (2026-09-10): O tema passou a ser aplicado antes da montagem
 */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { initTheme } from "./hooks/useTheme"
import "./index.css"

// Antes de qualquer coisa: se o tema salvo é escuro, o <html> já nasce escuro
initTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
