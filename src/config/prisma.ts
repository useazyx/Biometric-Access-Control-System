/**
 * prisma.ts - Prepara o Prisma pra gente usar no projeto
 * # Pra que serve?
 * - Exporta uma única cópia do Prisma pra todo o app
 * - Evita que a gente crie várias conexões com o banco sem querer
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2025-04-10 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-12): Implementação inicial do cliente Prisma
 * - v1.1.0 (2025-04-10): Otimização de logs para desenvolvimento
 */

import { PrismaClient } from "@prisma/client";

// Solução para hot-reload no desenvolvimento
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Cria ou reusa a instância existente
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

// Em desenvolvimento, guarda a instância no global pra evitar recriação
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
