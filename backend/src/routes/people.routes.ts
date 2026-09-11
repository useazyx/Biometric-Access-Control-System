/**
 * people.routes.ts - Rotas do cadastro geral de pessoas
 * # Pra que serve?
 * - Definir os endpoints que criam, listam, atualizam e apagam pessoas
 * - Validar tudo que entra antes de chegar no controller
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo, mantendo os mesmos caminhos e schemas
 * - v1.1.0 (2026-09-09): O schema de resposta do GET_PERSON não listava os campos de
 *                        visitante além de company, e o serializer descartava o resto
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import {
  CPF_SCHEMA,
  DATE_SCHEMA,
  EMAIL_SCHEMA,
  ERROR_RESPONSE,
  FULL_NAME_SCHEMA,
  PAGINATION_RESPONSE,
  PAGINATION_SCHEMA,
  PERSON_TYPES,
  PHONE_SCHEMA,
  UNIT_CODE_SCHEMA,
  UNIT_TYPES,
} from "./schemas/shared"
import { CreatePersonController } from "../controllers/people/CreatePersonController"
import { DeletePersonController } from "../controllers/people/DeletePersonController"
import { GetPersonController } from "../controllers/people/GetPersonController"
import { ListPersonController } from "../controllers/people/ListPersonController"
import { UpdatePersonController } from "../controllers/people/UpdatePersonController"

// Bloco de dados que aparece igual na listagem e no detalhe de uma pessoa
const PERSON_SUMMARY = {
  id: z.number(),
  full_name: z.string(),
  type: z.string(),
  email: z.string().nullable(),
  cpf: z.string().nullable(),
  main_unit_type: z.string().nullable(),
}

const CREATE_PERSON_SCHEMA = {
  tags: ["people", "creation"],
  description: "Cadastra uma pessoa nova",
  body: z.object({
    full_name: FULL_NAME_SCHEMA,
    birth_date: DATE_SCHEMA.optional(),
    cpf: CPF_SCHEMA,
    email: EMAIL_SCHEMA,
    phone: PHONE_SCHEMA,
    type: z.enum(PERSON_TYPES, { message: "Tipo de pessoa inválido" }),
    main_unit_type: z.enum(UNIT_TYPES, { message: "Tipo de unidade inválido" }),
    unit_code: UNIT_CODE_SCHEMA,
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      created_at: z.string().datetime(),
      email: z.string(),
      full_name: z.string(),
      temporary_password_sent: z.boolean(), // Avisa se mandamos senha temporária
    }),
    400: ERROR_RESPONSE,
  },
}

const LIST_PERSON_SCHEMA = {
  tags: ["people", "search"],
  description: "Lista pessoas por unidade",
  querystring: z.object({
    unit_code: z.string(),
    type: z.enum(PERSON_TYPES).optional(),
    ...PAGINATION_SCHEMA,
  }),
  response: {
    200: z.object({
      people: z.array(
        z.object({
          ...PERSON_SUMMARY,
          registration_unit: z
            .object({
              unit_code: z.string(),
              name: z.string(),
            })
            .nullable(),
        }),
      ),
      ...PAGINATION_RESPONSE,
      // O controller manda um resumo simpático junto ("Encontramos N pessoas!")
      message: z.string().optional(),
    }),
  },
}

const GET_PERSON_SCHEMA = {
  tags: ["people"],
  description: "Pega todos os dados de uma pessoa pelo CPF",
  body: z.object({
    cpf: CPF_SCHEMA,
  }),
  response: {
    200: z.object({
      ...PERSON_SUMMARY,
      cpf: z.string(),
      birth_date: z.string().nullable(),
      phone: z.string().nullable(),
      registration_unit: z
        .object({
          id: z.number(),
          name: z.string(),
          unit_code: z.string(),
        })
        .nullable(),
      student: z
        .object({
          id: z.number(),
          rm: z.string(),
          status: z.string(),
        })
        .nullable()
        .optional(),
      employee: z
        .object({
          id: z.number(),
          registration_number: z.string(),
        })
        .nullable()
        .optional(),
      // Atenção: tem que listar TODOS os campos que o GetPersonService devolve.
      // O serializer do Fastify joga fora o que não está no schema, e era por isso
      // que o formulário de edição de visitante abria sem motivo, data e responsável:
      // o serviço mandava os campos e o schema os descartava no caminho.
      visitor: z
        .object({
          id: z.number(),
          company: z.string().nullable(),
          visit_reason: z.string().nullable(),
          registration_date: z.string().nullable(),
          visit_expiry_date: z.string().nullable(),
          responsible_employee_id: z.number().nullable(),
        })
        .nullable()
        .optional(),
    }),
    404: z.object({
      error: z.string(),
      tip: z.string().optional(),
    }),
  },
}

const UPDATE_PERSON_SCHEMA = {
  tags: ["people", "update"],
  description: "Atualiza dados de uma pessoa",
  params: z.object({
    cpf: CPF_SCHEMA,
  }),
  body: z.object({
    full_name: FULL_NAME_SCHEMA.optional(),
    email: EMAIL_SCHEMA.optional(),
    phone: PHONE_SCHEMA.optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_fields: z.array(z.string()),
    }),
    404: z.object({
      error: z.string(),
      id: z.number(),
    }),
  },
}

const DELETE_PERSON_SCHEMA = {
  tags: ["people", "delete"],
  description: "Apaga uma pessoa",
  body: z.object({
    cpf: CPF_SCHEMA,
  }),
  response: {
    200: z.object({
      message: z.string(),
      details: z.object({
        message: z.string(),
        deletedPersonId: z.number(),
      }),
    }),
    404: z.object({
      error: z.string(),
      tip: z.string(),
    }),
    409: z.object({
      error: z.string(),
      message: z.string(),
      solution: z.string(),
    }),
  },
}

export async function peopleRoutes(fastify: FastifyInstance) {
  fastify.post("/people", { schema: CREATE_PERSON_SCHEMA }, async (request, reply) => {
    return new CreatePersonController().handle(request, reply)
  })

  fastify.get("/people", { schema: LIST_PERSON_SCHEMA }, async (request, reply) => {
    return new ListPersonController().handle(request, reply)
  })

  // É POST porque o CPF vai no corpo (não fica gravado no log de acesso do servidor)
  fastify.post("/people/get-people", { schema: GET_PERSON_SCHEMA }, async (request, reply) => {
    return new GetPersonController().handle(request, reply)
  })

  fastify.patch("/people/:cpf", { schema: UPDATE_PERSON_SCHEMA }, async (request, reply) => {
    return new UpdatePersonController().handle(request, reply)
  })

  fastify.delete("/people", { schema: DELETE_PERSON_SCHEMA }, async (request, reply) => {
    return new DeletePersonController().handle(request, reply)
  })
}
