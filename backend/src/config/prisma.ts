/**
 * prisma.ts - Prepara o Prisma pra gente usar no projeto
 * # Pra que serve?
 * - Exporta uma única cópia do Prisma pra todo o app
 * - Evita que a gente crie várias conexões com o banco sem querer
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-03-12): Implementação inicial do cliente Prisma
 * - v1.1.0 (2025-04-10): Otimização de logs para desenvolvimento
 * - v1.2.0 (2026-09-09): Log de query só em desenvolvimento (em produção enchia o log
 *                        e ainda imprimia dado de usuário nas consultas)
 */

import { PrismaClient } from "@prisma/client"

// Solução para hot-reload no desenvolvimento
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Em desenvolvimento a gente quer ver cada query pra debugar.
// Em produção isso seria um problema: enche o log e vaza dado de usuário no meio do SQL.
const isDevelopment = process.env.NODE_ENV !== "production"

// Cria ou reusa a instância existente
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isDevelopment ? ["query", "info", "warn", "error"] : ["warn", "error"],
  })

// Em desenvolvimento, guarda a instância no global pra evitar recriação no hot-reload
if (isDevelopment) {
  globalForPrisma.prisma = prisma
}
