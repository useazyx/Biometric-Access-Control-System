/**
 * api.ts - O cliente HTTP que fala com o backend
 * # Pra que serve?
 * - Anexar o token em toda requisição, sem cada tela lembrar de fazer isso
 * - Traduzir o erro da API numa mensagem que a pessoa entende
 * - Avisar a interface quando tem requisição em andamento (pra barra de progresso)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-12): Criação do cliente com interceptors de token e de erro
 * - v2.0.0 (2026-09-09): O evento de "terminou de carregar" só era disparado quando dava
 *                        ERRO, então o contador de carregamento nunca voltava a zero.
 *                        Agora dispara nos dois casos, num lugar só. O erro de validação
 *                        também passou a mostrar qual campo está errado, em vez de
 *                        um "ValidationError" seco.
 */

import axios, { AxiosError } from "axios"
import { toast } from "sonner"

// Eventos que a barra de progresso do topo escuta
export const LOADING_START = "global-loading-start"
export const LOADING_STOP = "global-loading-stop"

// As chaves do localStorage, iguais às do AuthContext
const TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:2077",
  timeout: 15000,
})

// Avisa a interface que começou/terminou uma requisição
const notifyLoadingStart = () => document.dispatchEvent(new Event(LOADING_START))
const notifyLoadingStop = () => document.dispatchEvent(new Event(LOADING_STOP))

// Interceptor de ida: coloca o token e liga a barra de progresso
api.interceptors.request.use(
  (config) => {
    notifyLoadingStart()

    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    // Se nem saiu do navegador, a barra tem que parar do mesmo jeito
    notifyLoadingStop()
    return Promise.reject(error)
  },
)

// Interceptor de volta: desliga a barra e trata os erros
api.interceptors.response.use(
  (response) => {
    // Isto aqui faltava: no sucesso a barra nunca era desligada
    notifyLoadingStop()
    return response
  },
  (error: AxiosError<ApiErrorBody>) => {
    notifyLoadingStop()
    handleResponseError(error)
    return Promise.reject(error)
  },
)

// Formato de erro que o backend devolve
interface ApiErrorBody {
  error?: string
  message?: string
  // Lista de campos que não passaram na validação
  details?: { path: string; message: string }[]
}

// Decide o que mostrar pra pessoa em cada tipo de erro
function handleResponseError(error: AxiosError<ApiErrorBody>) {
  const status = error.response?.status

  // Sem resposta nenhuma: ou o backend está fora do ar, ou estourou o tempo
  if (!error.response) {
    const timedOut = error.code === "ECONNABORTED"
    toast.error(
      timedOut ? "A requisição demorou demais. Tenta de novo." : "Não consegui falar com o servidor.",
      { description: "Confere se o backend está rodando." },
    )
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

  if (status === 404) {
    toast.error(extractMessage(error) || "Não encontrei o que você pediu.")
    return
  }

  if (status === 400 || status === 409 || status === 422) {
    toast.error(extractMessage(error) || "Alguns dados vieram errados.", {
      description: describeValidationDetails(error),
    })
    return
  }

  if (status >= 500) {
    toast.error("Erro no servidor. Tenta de novo mais tarde.")
    return
  }

  toast.error(extractMessage(error) || "Erro inesperado")
}

// Token expirado ou inválido: limpa a sessão e volta pro login
function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem("user")
  localStorage.removeItem("access_log_id")

  // Evita loop de redirecionamento se a pessoa já estiver na tela de login
  if (window.location.pathname !== "/login") {
    toast.error("Sessão expirada", { description: "Faça login novamente." })
    window.location.replace("/login")
  }
}

// Pega a mensagem mais útil que o backend mandou
function extractMessage(error: AxiosError<ApiErrorBody>): string | undefined {
  const body = error.response?.data

  // Se veio lista de campos inválidos, o primeiro campo é a informação mais direta
  const firstDetail = body?.details?.[0]
  if (firstDetail) return firstDetail.message

  return body?.message || body?.error
}

// Junta os campos inválidos numa linha só, pra mostrar embaixo da mensagem
function describeValidationDetails(error: AxiosError<ApiErrorBody>): string | undefined {
  const details = error.response?.data?.details

  if (!details || details.length <= 1) return undefined

  return details.map((detail) => `${detail.path}: ${detail.message}`).join(" · ")
}
