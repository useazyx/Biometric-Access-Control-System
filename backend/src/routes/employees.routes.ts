/**
 * employees.routes.ts - Rotas dos funcionários
 * # Pra que serve?
 * - Definir os endpoints que criam, listam e atualizam funcionários
 * - O funcionário é o vínculo entre uma Person e um cargo (Role), e é quem acessa o sistema web
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
  DATE_SCHEMA,
  ERROR_RESPONSE,
  PAGINATION_RESPONSE,
  PAGINATION_SCHEMA,
} from "./schemas/shared"
import { CreateEmployeeController } from "../controllers/employees/CreateEmployeeController"
import { ListEmployeesController } from "../controllers/employees/ListEmployeesController"
import { UpdateEmployeeController } from "../controllers/employees/UpdateEmployeeController"
import { GetEmployeeByRegistrationController } from "../controllers/employees/GetEmployeeByRegistrationController"

const CREATE_EMPLOYEE_SCHEMA = {
  tags: ["employees", "creation"],
  description: "Cadastra um funcionário novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    role_id: z.number({ message: "ID do cargo precisa ser número" }),
    registration_number: z
      .string()
      .min(5, {
        message: "Registro muito curto (min 5 caracteres)",
      })
      .max(20, {
        message: "Registro muito longo (max 20)",
      }),
    admission_date: DATE_SCHEMA.optional(),
    active: z.boolean().optional(),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      employee: z.object({
        id: z.number(),
        registration_number: z.string(),
        person_id: z.number(),
      }),
    }),
    400: ERROR_RESPONSE,
  },
}

const LIST_EMPLOYEES_SCHEMA = {
  tags: ["employees", "search"],
  description: "Lista funcionários por unidade",
  querystring: z.object({
    unit_code: z.string(),
    ...PAGINATION_SCHEMA,
  }),
  response: {
    200: z.object({
      employees: z.array(
        z.object({
          id: z.number(),
          full_name: z.string(),
          registration_number: z.string(),
          email: z.string().nullable(),
          cpf: z.string().optional(),
          active: z.boolean().optional(),
          admission_date: z.union([z.string(), z.date()]).nullable().optional(),
          registration_unit_id: z.number(),
          person_type: z.string().optional(),
          role_name: z.string().optional(),
        }),
      ),
      ...PAGINATION_RESPONSE,
    }),
  },
}

const GET_EMPLOYEE_BY_REGISTRATION_SCHEMA = {
  tags: ["employees"],
  description: "Busca um funcionário pelo número de registro",
  body: z.object({
    registration_number: z.string().min(1, { message: "Número de registro obrigatório" }),
  }),
  response: {
    200: z.object({
      cpf: z.string(),
      person_id: z.number(),
      employee_id: z.number(),
    }),
    404: ERROR_RESPONSE,
  },
}

const UPDATE_EMPLOYEE_SCHEMA = {
  tags: ["employees", "update"],
  description: "Atualiza dados de um funcionário",
  params: z.object({
    cpf: CPF_SCHEMA,
  }),
  body: z.object({
    role_name: z.string().min(3, { message: "Cargo muito curto (min 3 caracteres)" }).optional(),
    active: z.boolean().optional(),
    admission_date: DATE_SCHEMA.optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_employee: z.object({
        id: z.number(),
        registration_number: z.string(),
      }),
    }),
    404: ERROR_RESPONSE,
  },
}

export async function employeesRoutes(fastify: FastifyInstance) {
  fastify.post("/employees", { schema: CREATE_EMPLOYEE_SCHEMA }, async (request, reply) => {
    return new CreateEmployeeController().handle(request, reply)
  })

  fastify.get("/employees", { schema: LIST_EMPLOYEES_SCHEMA }, async (request, reply) => {
    return new ListEmployeesController().handle(request, reply)
  })

  fastify.post(
    "/employees/get-by-registration",
    { schema: GET_EMPLOYEE_BY_REGISTRATION_SCHEMA },
    async (request, reply) => {
      return new GetEmployeeByRegistrationController().handle(request, reply)
    },
  )

  fastify.patch("/employees/:cpf", { schema: UPDATE_EMPLOYEE_SCHEMA }, async (request, reply) => {
    return new UpdateEmployeeController().handle(request, reply)
  })
}
