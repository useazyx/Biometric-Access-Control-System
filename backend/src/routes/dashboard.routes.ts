/**
 * dashboard.routes.ts - Rotas dos números da tela inicial
 * # Pra que serve?
 * - Entregar os totais e as distribuições que a tela de dashboard mostra
 * - Cada rota devolve um recorte diferente pra não pesar tudo numa consulta só
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo, mantendo os mesmos caminhos e schemas
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import { GetDashboardStatisticsController } from "../controllers/GetDashboardStatisticsController"
import { GetPeopleBreakdownController } from "../controllers/GetPeopleBreakdownController"
import { GetUnitBreakdownController } from "../controllers/GetUnitBreakdownController"
import { ListRolesController } from "../controllers/roles/ListRolesController"

const GET_DASHBOARD_STATISTICS_SCHEMA = {
  tags: ["dashboard"],
  description: "Obtém os totais gerais do dashboard",
  response: {
    200: z.object({
      statistics: z.object({
        totalPeople: z.number(),
        totalStudents: z.number(),
        totalEmployees: z.number(),
        totalUnits: z.number(),
        totalVisitors: z.number().optional(),
      }),
      message: z.string(),
    }),
  },
}

const GET_PEOPLE_BREAKDOWN_SCHEMA = {
  tags: ["dashboard"],
  description: "Distribuição de pessoas por tipo",
  response: {
    200: z.object({
      breakdown: z.object({
        student: z.number(),
        teacher: z.number(),
        employee: z.number(),
        coordinator: z.number(),
        inspector: z.number(),
        visitor: z.number(),
      }),
    }),
  },
}

const GET_UNIT_BREAKDOWN_SCHEMA = {
  tags: ["dashboard"],
  description: "Estatísticas de unidades por tipo e extensão",
  response: {
    200: z.object({
      breakdown: z.object({
        fatec: z.number(),
        etec: z.number(),
        fatec_extension: z.number(),
        etec_extension: z.number(),
      }),
    }),
  },
}

const LIST_ROLES_SCHEMA = {
  tags: ["roles"],
  description: "Lista os cargos disponíveis (pra preencher os selects do front)",
  response: {
    200: z.object({
      roles: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          permission_level: z.number(),
          description: z.string().nullable(),
        }),
      ),
      total: z.number(),
    }),
  },
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get("/dashboard/statistics", { schema: GET_DASHBOARD_STATISTICS_SCHEMA }, async (request, reply) => {
    return new GetDashboardStatisticsController().handle(request, reply)
  })

  fastify.get("/dashboard/people-breakdown", { schema: GET_PEOPLE_BREAKDOWN_SCHEMA }, async (request, reply) => {
    return new GetPeopleBreakdownController().handle(request, reply)
  })

  fastify.get("/dashboard/unit-breakdown", { schema: GET_UNIT_BREAKDOWN_SCHEMA }, async (request, reply) => {
    return new GetUnitBreakdownController().handle(request, reply)
  })

  fastify.get("/roles", { schema: LIST_ROLES_SCHEMA }, async (request, reply) => {
    return new ListRolesController().handle(request, reply)
  })
}
