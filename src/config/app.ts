/**
 * app.ts - Cuida dos ajustes do nosso app (tipo as chaves da casa)
 * # Pra que serve?
 * - Pega as variáveis de ambiente (aqueles segredos que a gente coloca no .env)
 * - Dá valores seguros padrão pra não quebrar se faltar algo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-04-20 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-10): Configuração básica das variáveis
 * - v1.1.0 (2025-04-05): Adicionadas validações de segurança para produção
 * - v1.2.0 (2025-04-20): Suporte a múltiplos ambientes (dev/staging/prod)
 */

import dotenv from "dotenv";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Como a gente organiza as configurações (o que precisa pra app funcionar)

export interface AppConfig {
  PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  DATABASE_URL: string;
  ENVIRONMENT: string;
}

// Valores de segurança pra quando a gente tá desenvolvendo (pra não ter que configurar tudo)
const DEFAULT_PORT = 3000;
const DEFAULT_JWT_SECRET = "default-secret";
const DEFAULT_JWT_EXPIRES_IN = "8h";
const DEFAULT_DATABASE_URL = "postgresql://user:password@localhost:5432/db";
const DEFAULT_ENVIRONMENT = "development";

// Pega a porta do servidor: se não tiver definida, usa a 3000 (tá bom pra testar)
const getPort = (): number =>
  parseInt(process.env.PORT || DEFAULT_PORT.toString());

// Pega o segredo do JWT: se não tiver, usa um padrão (só pra desenvolvimento, hein!)
const getJwtSecret = (): string => process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

// Pega o tempo de expiração do token: se não tiver, usa 8 horas (pra não ficar logando toda hora)
const getJwtExpiresIn = (): string =>
  process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;

// Pega o endereço do banco de dados: se não tiver, usa um local (só pra desenvolvimento)
const getDatabaseUrl = (): string =>
  process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

// Descobre se a gente tá em desenvolvimento ou produção (pra se comportar diferente)
const getEnvironment = (): string =>
  process.env.NODE_ENV || DEFAULT_ENVIRONMENT;

// Junta tudo pra formar a configuração do app
const config: AppConfig = {
  PORT: getPort(),
  JWT_SECRET: getJwtSecret(),
  JWT_EXPIRES_IN: getJwtExpiresIn(),
  DATABASE_URL: getDatabaseUrl(),
  ENVIRONMENT: getEnvironment(),
};

// Se tiver em produção e usando segredo padrão: PERIGO! (avisa no console)
if (
  config.JWT_SECRET === DEFAULT_JWT_SECRET &&
  config.ENVIRONMENT === "production"
) {
  console.warn(
    "PERIGO: Tá usando segredo padrão do JWT em produção! Isso é furada! 🚨"
  );
}

// Em produção, o endereço do banco é obrigatório! Se faltar, quebra tudo logo no começo
if (!config.DATABASE_URL && config.ENVIRONMENT === "production") {
  throw new Error(
    "Faltou o DATABASE_URL! Em produção isso é obrigatório, amigão!"
  );
}

export default config;
