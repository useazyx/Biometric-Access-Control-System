/**
 * visitors.routes.ts - Rotas dos visitantes
 * # Pra que serve?
 * - Definir os endpoints que registram, listam e atualizam visitantes
 * - Todo visitante precisa de um funcionário responsável por ele dentro da unidade
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo; a listagem e o update ganharam schema, que antes não tinham
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import { CPF_SCHEMA, ERROR_RESPONSE, PAGINATION_RESPONSE, PAGINATION_SCHEMA } from "./schemas/shared"
import { CreateVisitorController } from "../controllers/visitors/CreateVisitorController"
import { ListVisitorsController } from "../controllers/visitors/ListVisitorsController"
import { UpdateVisitorController } from "../controllers/visitors/UpdateVisitorController"

const CREATE_VISITOR_SCHEMA = {
  tags: ["visitors", "creation"],
  description: "Registra um visitante novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    company: z.string().max(100, { message: "Empresa muito longa (max 100)" }).optional(),
    visit_reason: z
      .string()
      .min(5, { message: "Motivo muito curto (min 5 caracteres)" })
      .max(200, {
        message: "Motivo muito longo (max 200)",
      })
      .optional(),
    responsible_employee_cpf: CPF_SCHEMA.describe("CPF do funcionário responsável (obrigatório)"),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      visitor: z.object({
        id: z.number(),
        person_id: z.number(),
      }),
    }),
    400: ERROR_RESPONSE,
  },
}

const LIST_VISITORS_SCHEMA = {
  tags: ["visitors", "search"],
  description: "Lista visitantes por unidade",
  querystring: z.object({
    unit_code: z.string(),
    ...PAGINATION_SCHEMA,
  }),
  response: {
    200: z.object({
      visitors: z.array(
        z.object({
          id: z.number(),
          company: z.string().nullable(),
          visit_reason: z.string().nullable(),
          registration_date: z.union([z.string(), z.date()]),
          visit_expiry_date: z.union([z.string(), z.date()]).nullable(),
          person_id: z.number(),
          responsible_employee_id: z.number().nullable(),
          person: z.object({
            id: z.number(),
            full_name: z.string(),
            cpf: z.string(),
            email: z.string().nullable(),
          }),
          responsible_employee: z
            .object({
              id: z.number(),
              person: z.object({
                id: z.number(),
                full_name: z.string(),
                cpf: z.string(),
              }),
            })
            .nullable(),
        }),
      ),
      ...PAGINATION_RESPONSE,
    }),
  },
}

const UPDATE_VISITOR_SCHEMA = {
  tags: ["visitors", "update"],
  description: "Atualiza dados de um visitante",
  params: z.object({
    id: z.coerce.number().int().positive({ message: "ID do visitante inválido" }),
  }),
  body: z.object({
    company: z.string().max(100, { message: "Empresa muito longa (max 100)" }).optional(),
    visit_reason: z.string().max(200, { message: "Motivo muito longo (max 200)" }).optional(),
    registration_date: z.string().optional(),
    visit_expiry_date: z.string().nullable().optional(),
    responsible_employee_id: z.number().int().positive().nullable().optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_visitor: z.object({
        id: z.number(),
        person_id: z.number(),
      }),
    }),
    400: ERROR_RESPONSE,
    404: ERROR_RESPONSE,
  },
}

export async function visitorsRoutes(fastify: FastifyInstance) {
  fastify.post("/visitors", { schema: CREATE_VISITOR_SCHEMA }, async (request, reply) => {
    return new CreateVisitorController().handle(request, reply)
  })

  fastify.get("/visitors", { schema: LIST_VISITORS_SCHEMA }, async (request, reply) => {
    return new ListVisitorsController().handle(request, reply)
  })

  fastify.patch("/visitors/:id", { schema: UPDATE_VISITOR_SCHEMA }, async (request, reply) => {
    return new UpdateVisitorController().handle(request, reply)
  })
}
