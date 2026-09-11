/**
 * vite.config.ts - Configuração de build e do servidor de desenvolvimento
 * # Pra que serve?
 * - Ligar o plugin do React e o atalho "@" pra pasta src
 * - Separar as dependências grandes em pedaços, pra não gerar um arquivo só de 1 MB
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-10): Configuração inicial (gerada pela ferramenta de scaffolding)
 * - v2.0.0 (2026-09-09): Removido o plugin lovable-tagger, porta padronizada em 5173
 *                        (a mesma que o CORS do backend espera) e adicionado o
 *                        code splitting, porque o bundle era um arquivo único de 1 MB.
 */

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"

// Porta padrão do Vite. Tem que bater com o CORS_ORIGIN e o FRONTEND_URL do backend.
const DEV_PORT = 5173

export default defineConfig({
  server: {
    port: DEV_PORT,
    // Se a porta estiver ocupada, avisa em vez de escolher outra em silêncio
    // (senão o CORS do backend passa a recusar sem explicação aparente)
    strictPort: true,
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Separa as bibliotecas grandes do nosso código: elas mudam pouco, então o
    // navegador reaproveita o cache delas entre um deploy e outro
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "chart-vendor": ["recharts"],
          "form-vendor": ["react-hook-form", "zod", "@hookform/resolvers"],
          "date-vendor": ["date-fns", "react-day-picker"],
        },
      },
    },
    // Depois de separar, nenhum pedaço deve passar disso. Se passar, o aviso do
    // Vite volta a aparecer e a gente sabe que precisa dividir mais.
    chunkSizeWarningLimit: 600,
  },
})
