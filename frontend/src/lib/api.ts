/**
 * api.ts - O cliente HTTP que fala com o backend
 * # Pra que serve?
 * - Anexar o token em toda requisição, sem cada tela lembrar de fazer isso
 * - Traduzir o erro da API numa mensagem que a pessoa entende
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 3.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-12): Criação do cliente com interceptors de token e de erro
 * - v2.0.0 (2026-09-09): Correção do contador de carregamento
 * - v3.0.0 (2026-09-10): Reescrito pro painel novo. O contador de carregamento por
 *                        evento no document saiu: quem controla estado de carregamento
 *                        agora é o React Query, que já sabe disso por tela.
 */

import axios, { AxiosError } from "axios"
import { toast } from "sonner"

/** As chaves do localStorage ficam num lugar só pra não errar o nome em outra tela. */
export const STORAGE_KEYS = {
  token: "access_token",
  user: "user",
  accessLogId: "access_log_id",
} as const

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:2077",
  timeout: 15000,
})

// Ida: carimba o token em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token)
  if (token) config.headers.Authorization = "Bearer " + token
  return config
})

// Volta: transforma o erro da API em aviso legível
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    reportError(error)
    return Promise.reject(error)
  },
)

/** Formato de erro que o backend devolve. */
interface ApiErrorBody {
  error?: string
  message?: string
  /** Lista de campos que não passaram na validação do Zod. */
  details?: { path: string; message: string }[]
  tip?: string
  solution?: string
}

/** Pega a mensagem mais útil que o backend mandou. */
export function apiErrorMessage(error: unknown, fallback = "Erro inesperado"): string {
  const axiosError = error as AxiosError<ApiErrorBody>
  const body = axiosError?.response?.data

  if (!body) {
    if (axiosError?.code === "ECONNABORTED") return "A requisição demorou demais."
    if (!axiosError?.response) return "Não consegui falar com o servidor."
    return fallback
  }

  // Se veio lista de campos inválidos, o primeiro é a informação mais direta
  const firstDetail = body.details?.[0]
  if (firstDetail) return firstDetail.message

  return body.message || body.error || fallback
}

/** Junta os campos inválidos numa linha só, pra mostrar embaixo da mensagem. */
function describeDetails(error: AxiosError<ApiErrorBody>): string | undefined {
  const body = error.response?.data
  const details = body?.details

  if (details && details.length > 1) {
    return details.map((detail) => detail.path + ": " + detail.message).join(" · ")
  }

  return body?.tip || body?.solution
}

/** Decide o que mostrar pra pessoa em cada tipo de erro. */
function reportError(error: AxiosError<ApiErrorBody>) {
  const status = error.response?.status

  // Sem resposta nenhuma: ou o backend está fora do ar, ou estourou o tempo
  if (!error.response) {
    toast.error(apiErrorMessage(error), {
      description: "Confere se o backend está rodando em " + api.defaults.baseURL,
    })
    return
  }

  if (status === 401) {
    handleUnauthorized()
    return
  }

  if (status === 403) {
    toast.error("Acesso negado", { description: "Seu usuário não tem permissão pra isso." })
    return
  }

  if (status && status >= 500) {
    toast.error("Erro no servidor", { description: "Tenta de novo daqui a pouco." })
    return
  }

  toast.error(apiErrorMessage(error), { description: describeDetails(error) })
}

/** Token expirado ou inválido: limpa a sessão e volta pro login. */
function handleUnauthorized() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))

  // Evita loop de redirecionamento se a pessoa já estiver na tela de login
  if (window.location.pathname !== "/login") {
    toast.error("Sessão expirada", { description: "Entre de novo pra continuar." })
    window.location.replace("/login")
  }
}
