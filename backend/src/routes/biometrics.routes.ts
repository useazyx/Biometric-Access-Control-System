/**
 * biometrics.routes.ts - Rotas das digitais cadastradas
 * # Pra que serve?
 * - Definir os endpoints que cadastram, listam e apagam biometrias
 * - Deixar disponível o gerador de template falso, pra testar sem o sensor R307 na mão
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
  FINGERS,
  PAGINATION_RESPONSE,
  PAGINATION_SCHEMA,
} from "./schemas/shared"
import { CreateBiometricController } from "../controllers/biometrics/CreateBiometricController"
import { DeleteBiometricController } from "../controllers/biometrics/DeleteBiometricController"
import { ListBiometricsController } from "../controllers/biometrics/ListBiometricsController"
import { GenerateRandomBiometricController } from "../controllers/biometrics/GenerateRandomBiometricController"

// Qual dedo é: usa a lista compartilhada pra não escrever os 10 nomes em cada rota
const FINGER_SCHEMA = z.enum(FINGERS, { message: "Dedo inválido. Use um dos valores permitidos." })

const CREATE_BIOMETRIC_SCHEMA = {
  tags: ["biometrics", "creation"],
  description: "Cadastra uma digital nova",
  body: z.object({
    cpf: CPF_SCHEMA,
    template: z.string().describe("Digital em formato base64"),
    finger: FINGER_SCHEMA,
    device: z.string().default("R307"),
    unit_code: z.string().min(3, { message: "Código da unidade inválido" }),
    quality: z
      .number()
      .min(0, { message: "Qualidade mínima: 0" })
      .max(100, { message: "Qualidade máxima: 100" })
      .optional(),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      person_id: z.number(),
      finger: z.string(),
      created_at: z.string().datetime(),
    }),
    400: ERROR_RESPONSE,
  },
}

const DELETE_BIOMETRIC_SCHEMA = {
  tags: ["biometrics", "delete"],
  description: "Apaga uma digital",
  body: z.object({
    cpf: CPF_SCHEMA,
    finger: FINGER_SCHEMA,
  }),
  response: {
    200: z.object({
      message: z.string(),
    }),
    404: ERROR_RESPONSE,
  },
}

const LIST_BIOMETRICS_SCHEMA = {
  tags: ["biometrics", "search"],
  description: "Lista todas as digitais cadastradas",
  querystring: z.object({
    unit_code: z.string(),
    ...PAGINATION_SCHEMA,
  }),
  response: {
    200: z.object({
      biometrics: z.array(
        z.object({
          id: z.number(),
          person_id: z.number(),
          finger: z.string(),
          device: z.string(),
          registration_date: z.string(),
          unit_id: z.number(),
          unit: z.object({
            name: z.string(),
            unit_code: z.string(),
          }),
          person: z.object({
            full_name: z.string(),
            cpf: z.string(),
          }),
        }),
      ),
      ...PAGINATION_RESPONSE,
    }),
  },
}

const GENERATE_RANDOM_BIOMETRIC_SCHEMA = {
  tags: ["biometrics"],
  description: "Gera um template biométrico aleatório para testes",
  params: z.object({
    finger: FINGER_SCHEMA,
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        template: z.string(),
        finger: z.string(),
        quality: z.number().min(0).max(100),
        timestamp: z.string(),
      }),
    }),
    400: z.object({
      error: z.string(),
      validFingers: z.array(z.string()),
    }),
    500: ERROR_RESPONSE,
  },
}

export async function biometricsRoutes(fastify: FastifyInstance) {
  fastify.post("/biometrics", { schema: CREATE_BIOMETRIC_SCHEMA }, async (request, reply) => {
    return new CreateBiometricController().handle(request, reply)
  })

  fastify.get("/biometrics", { schema: LIST_BIOMETRICS_SCHEMA }, async (request, reply) => {
    return new ListBiometricsController().handle(request, reply)
  })

  fastify.delete("/biometrics", { schema: DELETE_BIOMETRIC_SCHEMA }, async (request, reply) => {
    return new DeleteBiometricController().handle(request, reply)
  })

  // Serve pra testar o cadastro de digital sem ter o sensor plugado
  fastify.get("/biometrics/generate/:finger", { schema: GENERATE_RANDOM_BIOMETRIC_SCHEMA }, async (request, reply) => {
    return new GenerateRandomBiometricController().handle(request, reply)
  })
}
