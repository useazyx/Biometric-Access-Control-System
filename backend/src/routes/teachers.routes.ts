/**
 * teachers.routes.ts - Rotas dos professores
 * # Pra que serve?
 * - Definir os endpoints que criam, listam e atualizam professores
 * - O professor é um complemento de um Employee que já existe (etapa 3 do cadastro)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo; as rotas de update ganharam schema, que antes não tinham
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import { CPF_SCHEMA, ERROR_RESPONSE, PAGINATION_RESPONSE, PAGINATION_SCHEMA, SEARCH_SCHEMA } from "./schemas/shared"
import { CreateTeacherController } from "../controllers/teachers/CreateTeacherController"
import { ListTeachersController } from "../controllers/teachers/ListTeachersController"
import { UpdateTeacherController } from "../controllers/teachers/UpdateTeacherController"

const CREATE_TEACHER_SCHEMA = {
  tags: ["teachers", "creation"],
  description: "Cadastra um professor novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    subjects: z.array(z.string()).min(1, { message: "Precisa de pelo menos uma matéria" }),
    can_teach_fatec: z.boolean().default(false),
    can_teach_etec: z.boolean().default(false),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      teacher: z.object({
        id: z.number(),
        employee_id: z.number(),
        subjects: z.array(z.string()),
      }),
    }),
    400: ERROR_RESPONSE,
  },
}

const LIST_TEACHERS_SCHEMA = {
  tags: ["teachers", "search"],
  description: "Lista professores por unidade",
  querystring: z.object({
    unit_code: z.string(),
    search: SEARCH_SCHEMA,
    ...PAGINATION_SCHEMA,
  }),
  response: {
    200: z.object({
      teachers: z.array(
        z.object({
          id: z.number(),
          full_name: z.string(),
          employee_id: z.number(),
          subjects: z.array(z.string()),
          can_teach_fatec: z.boolean().optional(),
          can_teach_etec: z.boolean().optional(),
          person_id: z.number().optional(),
        }),
      ),
      ...PAGINATION_RESPONSE,
    }),
  },
}

const UPDATE_TEACHER_SCHEMA = {
  tags: ["teachers", "update"],
  description: "Atualiza dados de um professor",
  params: z.object({
    id: z.coerce.number().int().positive({ message: "ID do professor inválido" }),
  }),
  body: z.object({
    subjects: z.array(z.string()).min(1, { message: "Precisa de pelo menos uma matéria" }).optional(),
    can_teach_fatec: z.boolean().optional(),
    can_teach_etec: z.boolean().optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_teacher: z.object({
        id: z.number(),
        employee_id: z.number(),
      }),
    }),
    400: ERROR_RESPONSE,
    404: ERROR_RESPONSE,
  },
}

export async function teachersRoutes(fastify: FastifyInstance) {
  fastify.post("/teachers", { schema: CREATE_TEACHER_SCHEMA }, async (request, reply) => {
    return new CreateTeacherController().handle(request, reply)
  })

  fastify.get("/teachers", { schema: LIST_TEACHERS_SCHEMA }, async (request, reply) => {
    return new ListTeachersController().handle(request, reply)
  })

  fastify.patch("/teachers/:id", { schema: UPDATE_TEACHER_SCHEMA }, async (request, reply) => {
    return new UpdateTeacherController().handle(request, reply)
  })
}
