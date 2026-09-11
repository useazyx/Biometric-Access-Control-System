/**
 * auth.routes.ts - Rotas de login, logout e senha
 * # Pra que serve?
 * - Definir os endpoints de autenticação e o que cada um aceita de entrada
 * - Separar o que é público (login, esqueci a senha) do que exige estar logado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo, mantendo os mesmos caminhos e schemas
 */

import type { FastifyInstance } from "fastify"
import z from "zod"
import { EMAIL_SCHEMA, ERROR_RESPONSE, PASSWORD_SCHEMA } from "./schemas/shared"
import { LoginController } from "../controllers/auth/LoginController"
import { LogoutController } from "../controllers/auth/LogoutController"
import { GetMeController } from "../controllers/auth/GetMeController"
import { ForgotPasswordController } from "../controllers/auth/ForgotPasswordController"
import { ChangePasswordController } from "../controllers/auth/ChangePasswordController"

const LOGIN_SCHEMA = {
  tags: ["auth"],
  description: "Faz login com email e senha",
  body: z.object({
    email: z.string().email({ message: "Email com formato errado" }),
    password: z.string().min(1, { message: "Senha obrigatória" }),
  }),
  response: {
    200: z.object({
      token: z.string(),
      person: z.object({
        id: z.number(),
        full_name: z.string(),
        type: z.string(),
        email: z.string(),
        unit_id: z.number(),
      }),
      requires_password_change: z.boolean(),
      access_log_id: z.number(),
    }),
    401: ERROR_RESPONSE,
  },
}

const FORGOT_PASSWORD_SCHEMA = {
  tags: ["auth"],
  description: "Solicita reset de senha via email",
  body: z.object({
    email: z.string().email({ message: "Email com formato errado" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      email: z.string(),
    }),
    400: ERROR_RESPONSE,
  },
}

const GET_ME_SCHEMA = {
  tags: ["auth"],
  description: "Retorna dados completos do usuário logado",
  response: {
    200: z.object({
      id: z.number(),
      full_name: z.string(),
      birth_date: z.string().nullable(),
      cpf: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      type: z.string(),
      main_unit_type: z.string().nullable(),
      registration_unit: z
        .object({ id: z.number(), name: z.string(), unit_code: z.string() })
        .nullable(),
      student: z.object({ id: z.number(), rm: z.string(), status: z.string() }).nullable().optional(),
      employee: z.object({ id: z.number(), registration_number: z.string() }).nullable().optional(),
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
    401: ERROR_RESPONSE,
    404: ERROR_RESPONSE,
  },
}

const CHANGE_PASSWORD_SCHEMA = {
  tags: ["auth"],
  description: "Troca senha para usuário logado",
  body: z
    .object({
      current_password: z.string().min(1, { message: "Senha atual obrigatória" }),
      new_password: PASSWORD_SCHEMA,
      new_password_confirm: z.string().min(8, {
        message: "Confirmação muito curta (min 8 caracteres)",
      }),
    })
    .refine((data) => data.new_password === data.new_password_confirm, {
      message: "As senhas não batem",
      path: ["new_password_confirm"],
    }),
  response: {
    200: z.object({ message: z.string() }),
    400: ERROR_RESPONSE,
  },
}

const LOGOUT_SCHEMA = {
  tags: ["auth"],
  description: "Dá tchau e invalida o token",
  body: z.object({
    access_log_id: z.number().int().positive(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      timestamp: z.string().datetime(),
    }),
    401: ERROR_RESPONSE,
  },
}

// Rotas que qualquer um alcança sem token (é por elas que o usuário consegue entrar)
export async function publicAuthRoutes(fastify: FastifyInstance) {
  fastify.post("/login", { schema: LOGIN_SCHEMA }, async (request, reply) => {
    return new LoginController().handle(request, reply)
  })

  fastify.post("/forgot-password", { schema: FORGOT_PASSWORD_SCHEMA }, async (request, reply) => {
    return new ForgotPasswordController().handle(request, reply)
  })
}

// Rotas de conta que só fazem sentido pra quem já está logado
export async function authRoutes(fastify: FastifyInstance) {
  fastify.get("/me", { schema: GET_ME_SCHEMA }, async (request, reply) => {
    return new GetMeController().handle(request, reply)
  })

  fastify.post("/logout", { schema: LOGOUT_SCHEMA }, async (request, reply) => {
    return new LogoutController().handle(request, reply)
  })

  fastify.post("/change-password", { schema: CHANGE_PASSWORD_SCHEMA }, async (request, reply) => {
    return new ChangePasswordController().handle(request, reply)
  })
}
