/**
 * units.routes.ts - Rotas das unidades (Etecs e Fatecs)
 * # Pra que serve?
 * - Definir os endpoints que criam, listam, atualizam e apagam unidades
 * - A unidade é a raiz de tudo: toda pessoa e toda digital pertence a uma
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo; update e delete ganharam schema, que antes não tinham
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import { ERROR_RESPONSE, UNIT_CODE_SCHEMA, UNIT_TYPES } from "./schemas/shared"
import { CreateUnitsController } from "../controllers/units/CreateUnitsController"
import { GetUnitsController } from "../controllers/units/GetUnitsController"
import { UpdateUnitsController } from "../controllers/units/UpdateUnitsController"
import { DeleteUnitsController } from "../controllers/units/DeleteUnitsController"

// Como uma unidade é devolvida pro front (usado na criação e na listagem)
const UNIT_RESPONSE = {
  id: z.number(),
  name: z.string(),
  unit_type: z.string(),
  unit_code: z.string(),
}

const CREATE_UNITS_SCHEMA = {
  tags: ["units", "creation"],
  description: "Cadastra uma unidade nova",
  body: z.object({
    name: z
      .string()
      .min(3, { message: "Nome muito curto (min 3 caracteres)" })
      .max(100, { message: "Nome muito longo (max 100)" }),
    unit_type: z.enum(UNIT_TYPES, { message: "Tipo de unidade inválido" }),
    address: z
      .string()
      .min(5, { message: "Endereço muito curto (min 5 caracteres)" })
      .max(200, { message: "Endereço muito longo (max 200)" })
      .optional(),
    phone: z.string().max(20, { message: "Telefone muito longo (max 20)" }).optional(),
    unit_code: UNIT_CODE_SCHEMA,
    is_extension: z.boolean().default(false),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      unit: z.object(UNIT_RESPONSE),
    }),
    400: ERROR_RESPONSE,
  },
}

const GET_UNITS_SCHEMA = {
  tags: ["units", "search"],
  description: "Lista unidades cadastradas",
  querystring: z.object({
    type: z.enum(UNIT_TYPES).optional(),
    // Vem como "true"/"false" na query string, então precisa do coerce pra virar boolean
    is_extension: z.coerce.boolean().optional(),
  }),
  response: {
    200: z.object({
      units: z.array(
        z.object({
          ...UNIT_RESPONSE,
          address: z.string().nullable(),
          phone: z.string().nullable(),
          is_extension: z.boolean(),
        }),
      ),
      total: z.number(),
    }),
  },
}

const UPDATE_UNITS_SCHEMA = {
  tags: ["units", "update"],
  description: "Atualiza dados de uma unidade",
  params: z.object({
    id: z.coerce.number().int().positive({ message: "ID da unidade inválido" }),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, { message: "Nome muito curto (min 3 caracteres)" })
      .max(100, { message: "Nome muito longo (max 100)" })
      .optional(),
    unit_type: z.enum(UNIT_TYPES, { message: "Tipo de unidade inválido" }).optional(),
    address: z.string().max(200, { message: "Endereço muito longo (max 200)" }).optional(),
    phone: z.string().max(20, { message: "Telefone muito longo (max 20)" }).optional(),
    is_extension: z.boolean().optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_unit: z.object({
        id: z.number(),
        name: z.string(),
        unit_code: z.string(),
      }),
    }),
    400: ERROR_RESPONSE,
    404: ERROR_RESPONSE,
  },
}

const DELETE_UNITS_SCHEMA = {
  tags: ["units", "delete"],
  description: "Apaga uma unidade (só se não tiver ninguém cadastrado nela)",
  params: z.object({
    id: z.coerce.number().int().positive({ message: "ID da unidade inválido" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      deleted_unit_id: z.number().optional(),
    }),
    400: ERROR_RESPONSE,
    404: ERROR_RESPONSE,
    409: ERROR_RESPONSE,
  },
}

export async function unitsRoutes(fastify: FastifyInstance) {
  fastify.post("/units", { schema: CREATE_UNITS_SCHEMA }, async (request, reply) => {
    return new CreateUnitsController().handle(request, reply)
  })

  fastify.get("/units", { schema: GET_UNITS_SCHEMA }, async (request, reply) => {
    return new GetUnitsController().handle(request, reply)
  })

  fastify.patch("/units/:id", { schema: UPDATE_UNITS_SCHEMA }, async (request, reply) => {
    return new UpdateUnitsController().handle(request, reply)
  })

  fastify.delete("/units/:id", { schema: DELETE_UNITS_SCHEMA }, async (request, reply) => {
    return new DeleteUnitsController().handle(request, reply)
  })
}
