/**
 * index.ts - O mapa das rotas: junta os módulos e diz o que é público e o que é privado
 * # Pra que serve?
 * - Registrar todos os grupos de rota num lugar só
 * - Separar as rotas abertas (login) das que precisam de token
 * - Colocar o porteiro (authMiddleware) em tudo que é privado, de uma vez
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-03-20): Estrutura inicial de rotas
 * - v1.1.0 (2025-04-15): Adicionado sistema de autenticação
 * - v1.2.0 (2025-05-05): Integração com validação Zod
 * - v1.3.0 (2025-06-01): Suporte a paginação em endpoints críticos
 * - v1.4.0 (2025-06-20): Adicionadas rotas de biometria
 * - v2.0.0 (2026-09-09): Arquivo único de 1227 linhas quebrado em um módulo por domínio
 */

import type { FastifyInstance } from "fastify"
import { authMiddleware } from "../middlewares/authMiddleware"
import { authRoutes, publicAuthRoutes } from "./auth.routes"
import { peopleRoutes } from "./people.routes"
import { biometricsRoutes } from "./biometrics.routes"
import { accessRoutes } from "./access.routes"
import { studentsRoutes } from "./students.routes"
import { employeesRoutes } from "./employees.routes"
import { teachersRoutes } from "./teachers.routes"
import { visitorsRoutes } from "./visitors.routes"
import { unitsRoutes } from "./units.routes"
import { dashboardRoutes } from "./dashboard.routes"

// Ponto de partida: é isso que o server.ts registra no Fastify
export async function routes(fastify: FastifyInstance) {
  // Rotas abertas (não precisa de login) - é por aqui que o usuário consegue entrar
  await fastify.register(publicAuthRoutes)

  // Uma checagem simples pra saber se a API está de pé (útil em deploy e monitoramento)
  fastify.get("/health", { schema: { tags: ["health"], description: "Diz se a API está no ar" } }, async () => {
    return { status: "ok", timestamp: new Date().toISOString() }
  })

  // Rotas privadas (só entra com token válido)
  await fastify.register(privateRoutes)
}

// Registra as rotas privadas e coloca um porteiro (authMiddleware) em todas elas pra ver se tá logado mesmo
async function privateRoutes(fastify: FastifyInstance) {
  // Porteiro que verifica o token antes de deixar entrar em qualquer rota deste grupo
  fastify.addHook("preHandler", authMiddleware())

  await fastify.register(authRoutes)
  await fastify.register(dashboardRoutes)
  await fastify.register(peopleRoutes)
  await fastify.register(biometricsRoutes)
  await fastify.register(accessRoutes)
  await fastify.register(studentsRoutes)
  await fastify.register(employeesRoutes)
  await fastify.register(teachersRoutes)
  await fastify.register(visitorsRoutes)
  await fastify.register(unitsRoutes)
}
