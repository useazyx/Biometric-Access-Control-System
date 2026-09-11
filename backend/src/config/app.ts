/**
 * app.ts - Cuida dos ajustes do nosso app (tipo as chaves da casa)
 * # Pra que serve?
 * - Pega as variáveis de ambiente (aqueles segredos que a gente coloca no .env)
 * - Dá valores seguros padrão pra não quebrar em desenvolvimento
 * - Em produção, trava a subida se faltar algo importante, em vez de rodar quebrado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-03-10): Configuração básica das variáveis
 * - v1.1.0 (2025-04-05): Adicionadas validações de segurança para produção
 * - v1.2.0 (2025-04-20): Suporte a múltiplos ambientes (dev/staging/prod)
 * - v2.0.0 (2026-09-09): Virou a fonte única de configuração (o server.ts lia process.env
 *                        direto e ignorava este arquivo). Ganhou HOST, CORS_ORIGINS,
 *                        FRONTEND_URL e validação que derruba a subida em produção.
 */

import dotenv from "dotenv"

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config()

// Como a gente organiza as configurações (o que precisa pra app funcionar)
export interface AppConfig {
  PORT: number
  HOST: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  DATABASE_URL: string
  ENVIRONMENT: string
  CORS_ORIGINS: string[]
  FRONTEND_URL: string
}

// Valores de segurança pra quando a gente tá desenvolvendo (pra não ter que configurar tudo)
const DEFAULT_PORT = 2077
const DEFAULT_HOST = "127.0.0.1"
const DEFAULT_JWT_SECRET = "default-secret-somente-para-desenvolvimento"
const DEFAULT_JWT_EXPIRES_IN = "8h"
const DEFAULT_ENVIRONMENT = "development"
const DEFAULT_FRONTEND_URL = "http://localhost:5173"

// Pega a porta do servidor: se não tiver definida, usa a 2077
const getPort = (): number => Number.parseInt(process.env.PORT || String(DEFAULT_PORT))

// Pega o endereço de escuta: 127.0.0.1 só aceita local, 0.0.0.0 aceita de fora
const getHost = (): string => process.env.HOST || DEFAULT_HOST

// Pega o segredo do JWT: se não tiver, usa um padrão (só pra desenvolvimento, hein!)
const getJwtSecret = (): string => process.env.JWT_SECRET || DEFAULT_JWT_SECRET

// Pega o tempo de expiração do token: se não tiver, usa 8 horas (pra não ficar logando toda hora)
const getJwtExpiresIn = (): string => process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN

// Pega o endereço do banco de dados (sem valor padrão: banco errado é pior que banco nenhum)
const getDatabaseUrl = (): string => process.env.DATABASE_URL || ""

// Descobre se a gente tá em desenvolvimento ou produção (pra se comportar diferente)
const getEnvironment = (): string => process.env.NODE_ENV || DEFAULT_ENVIRONMENT

// Quem pode chamar a API: aceita vários endereços separados por vírgula no .env
const getCorsOrigins = (): string[] =>
  (process.env.CORS_ORIGIN || DEFAULT_FRONTEND_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

// Endereço público do front (usado nos links que vão dentro dos e-mails)
const getFrontendUrl = (): string => process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL

// Junta tudo pra formar a configuração do app
const config: AppConfig = {
  PORT: getPort(),
  HOST: getHost(),
  JWT_SECRET: getJwtSecret(),
  JWT_EXPIRES_IN: getJwtExpiresIn(),
  DATABASE_URL: getDatabaseUrl(),
  ENVIRONMENT: getEnvironment(),
  CORS_ORIGINS: getCorsOrigins(),
  FRONTEND_URL: getFrontendUrl(),
}

// Confere se dá pra rodar com essa configuração.
// Em desenvolvimento a gente só avisa; em produção a gente derruba na hora,
// porque subir com segredo padrão é pior do que não subir.
function validateConfig(appConfig: AppConfig): void {
  const isProduction = appConfig.ENVIRONMENT === "production"
  const problems: string[] = []

  // Sem banco não tem sistema
  if (!appConfig.DATABASE_URL) {
    problems.push("Faltou o DATABASE_URL! Sem banco o sistema não sobe.")
  }

  // Segredo padrão em produção = qualquer um consegue forjar um token
  if (appConfig.JWT_SECRET === DEFAULT_JWT_SECRET) {
    problems.push("Tá usando o JWT_SECRET padrão! Gera um aleatório e coloca no .env.")
  }

  // Segredo curto é quase tão ruim quanto o padrão
  if (appConfig.JWT_SECRET.length < 32) {
    problems.push("JWT_SECRET muito curto (mínimo 32 caracteres).")
  }

  // CORS liberado pra todo mundo em produção deixa qualquer site falar com a API
  if (isProduction && appConfig.CORS_ORIGINS.includes("*")) {
    problems.push('CORS_ORIGIN com "*" em produção! Coloca os endereços do front na mão.')
  }

  if (problems.length === 0) return

  if (isProduction) {
    // Em produção, melhor quebrar logo no começo do que rodar inseguro
    throw new Error(`Configuração inválida pra produção:\n- ${problems.join("\n- ")}`)
  }

  // Em desenvolvimento, só um puxão de orelha no console
  console.warn(`⚠️  Avisos de configuração (ok em desenvolvimento, mas arruma antes de subir):`)
  problems.forEach((problem) => console.warn(`   - ${problem}`))
}

validateConfig(config)

export default config
