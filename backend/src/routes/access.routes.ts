/**
 * access.routes.ts - Rotas do histórico de acessos
 * # Pra que serve?
 * - Definir os endpoints que listam os acessos pelo sensor e os logins no sistema web
 * - Aceitar filtro por unidade, pessoa, período e tipo de evento
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo, mantendo os mesmos caminhos e schemas
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import { EVENT_TYPES, PAGINATION_SCHEMA } from "./schemas/shared"
import { GetWebAccessLogsController } from "../controllers/access/GetWebAccessLogsController"
import { GetBiometricAccessLogsController } from "../controllers/access/GetBiometricAccessLogsController"

// Os dois históricos aceitam exatamente os mesmos filtros, então a gente escreve uma vez só
const LOG_FILTERS_SCHEMA = z.object({
  unit_id: z.coerce.number().int().optional(),
  cpf: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, { message: "Data inicial no formato errado (use YYYY-MM-DD)" }).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, { message: "Data final no formato errado (use YYYY-MM-DD)" }).optional(),
  event_type: z.enum(EVENT_TYPES).optional(),
  ...PAGINATION_SCHEMA,
})

// Dados da pessoa que aparecem junto de cada linha do histórico
const LOG_PERSON = z
  .object({
    full_name: z.string(),
    cpf: z.string(),
    type: z.string(),
  })
  .nullable()

// Dados da unidade onde o acesso aconteceu
const LOG_UNIT = z.object({
  name: z.string(),
  unit_code: z.string(),
})

const GET_WEB_ACCESS_LOGS_SCHEMA = {
  tags: ["access", "search"],
  description: "Pega histórico completo de logins no sistema web",
  querystring: LOG_FILTERS_SCHEMA,
  response: {
    200: z.object({
      logs: z.array(
        z.object({
          id: z.number(),
          login_time: z.string().datetime(),
          logout_time: z.string().datetime().nullable(),
          session_duration_minutes: z.number().nullable(),
          event_type: z.string(),
          person_id: z.number().nullable(),
          person: LOG_PERSON,
          unit_id: z.number(),
          unit: LOG_UNIT.nullable(),
        }),
      ),
      total_items: z.number().optional(),
      total: z.number().optional(),
      current_page: z.number(),
      total_pages: z.number(),
    }),
  },
}

const GET_BIOMETRIC_ACCESS_LOGS_SCHEMA = {
  tags: ["access", "search"],
  description: "Pega histórico completo de acessos pelo sensor biométrico",
  querystring: LOG_FILTERS_SCHEMA,
  response: {
    200: z.object({
      logs: z.array(
        z.object({
          id: z.number(),
          access_time: z.string().datetime(),
          event_type: z.string(),
          biometric_device: z.string().nullable(),
          is_authorized: z.boolean(),
          person_id: z.number().nullable(),
          person: LOG_PERSON,
          unit_id: z.number(),
          unit: LOG_UNIT,
        }),
      ),
      total_items: z.number(),
      total_pages: z.number(),
      current_page: z.number(),
      page_size: z.number(),
    }),
  },
}

export async function accessRoutes(fastify: FastifyInstance) {
  fastify.get("/biometric-access-logs", { schema: GET_BIOMETRIC_ACCESS_LOGS_SCHEMA }, async (request, reply) => {
    return new GetBiometricAccessLogsController().handle(request, reply)
  })

  fastify.get("/web-access-logs", { schema: GET_WEB_ACCESS_LOGS_SCHEMA }, async (request, reply) => {
    return new GetWebAccessLogsController().handle(request, reply)
  })
}
