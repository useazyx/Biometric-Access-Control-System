/**
 * students.routes.ts - Rotas dos alunos
 * # Pra que serve?
 * - Definir os endpoints que criam, listam e atualizam alunos
 * - O aluno é sempre um complemento de uma Person que já existe (etapa 2 do cadastro)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo, mantendo os mesmos caminhos e schemas
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import {
  CPF_SCHEMA,
  ERROR_RESPONSE,
  PAGINATION_RESPONSE,
  PAGINATION_SCHEMA,
  PERIODS,
  SEARCH_SCHEMA,
  STUDENT_STATUSES,
} from "./schemas/shared"
import { CreateStudentController } from "../controllers/students/CreateStudentController"
import { ListStudentsController } from "../controllers/students/ListStudentsController"
import { UpdateStudentController } from "../controllers/students/UpdateStudentController"

// RM (registro do aluno): só números, e não pode vir vazio
const RM_SCHEMA = z
  .string()
  .min(1, { message: "RM é obrigatório" })
  .refine((val) => /^\d+$/.test(val), {
    message: "RM só pode ter números",
  })

const CREATE_STUDENT_SCHEMA = {
  tags: ["students", "creation"],
  description: "Cadastra um aluno novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    rm: RM_SCHEMA,
    period: z.enum(PERIODS, { message: "Período inválido" }),
    course: z.string().optional(),
    class: z.string().optional(),
    responsible: z
      .string()
      .max(100, {
        message: "Responsável muito longo (max 100)",
      })
      .optional(),
    status: z.enum(STUDENT_STATUSES).optional(),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      student: z.object({
        id: z.number(),
        rm: z.string(),
        person_id: z.number(),
      }),
    }),
    400: ERROR_RESPONSE,
  },
}

const LIST_STUDENTS_SCHEMA = {
  tags: ["students", "search"],
  description: "Lista alunos por unidade",
  querystring: z.object({
    unit_code: z.string(),
    search: SEARCH_SCHEMA,
    ...PAGINATION_SCHEMA,
  }),
  response: {
    200: z.object({
      students: z.array(
        z.object({
          id: z.number(),
          full_name: z.string(),
          rm: z.string(),
          email: z.string().nullable(),
          person_id: z.number(),
          period: z.string(),
          course: z.string().nullable(),
          class_name: z.string().nullable(),
          status: z.string(),
          registration_unit: z.object({
            id: z.number(),
            name: z.string(),
            unit_code: z.string(),
          }),
        }),
      ),
      ...PAGINATION_RESPONSE,
    }),
  },
}

const UPDATE_STUDENT_SCHEMA = {
  tags: ["students", "update"],
  description: "Atualiza dados de um aluno",
  params: z.object({
    rm: z.string().min(1, { message: "RM inválido" }),
  }),
  body: z.object({
    rm: RM_SCHEMA.optional(),
    period: z.enum(PERIODS).optional(),
    course: z.string().optional(),
    class: z.string().optional(),
    status: z.enum(STUDENT_STATUSES).optional(),
    responsible: z.string().optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_student: z.object({
        id: z.number(),
        rm: z.string(),
      }),
    }),
    404: ERROR_RESPONSE,
  },
}

export async function studentsRoutes(fastify: FastifyInstance) {
  fastify.post("/students", { schema: CREATE_STUDENT_SCHEMA }, async (request, reply) => {
    return new CreateStudentController().handle(request, reply)
  })

  fastify.get("/students", { schema: LIST_STUDENTS_SCHEMA }, async (request, reply) => {
    return new ListStudentsController().handle(request, reply)
  })

  fastify.patch("/students/:rm", { schema: UPDATE_STUDENT_SCHEMA }, async (request, reply) => {
    return new UpdateStudentController().handle(request, reply)
  })
}
