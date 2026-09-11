/**
 * errorHandler.ts - Centralizador de tratamento de erros
 * # Pra que serve?
 * - Capturar todos os erros que acontecem na aplicação
 * - Responder pro cliente de um jeito padronizado e útil
 * - Não deixar detalhe interno (stack, SQL) escapar pro usuário em produção
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-03-18): Tratamento básico de erros
 * - v1.1.0 (2025-03-25): Adicionado tratamento especial para erros Zod
 * - v1.2.0 (2025-04-01): Logs detalhados em ambiente de desenvolvimento
 * - v1.3.0 (2025-04-08): Padronização de respostas de erro
 * - v1.4.0 (2025-04-15): Suporte a erros customizados do domínio
 * - v2.0.0 (2026-09-09): Migrado pro Zod 4 (issues em vez de errors), finalmente registrado
 *                        no servidor, e passou a tratar o FST_ERR_VALIDATION do Fastify
 *                        (que é a forma que o erro de schema realmente chega aqui).
 *                        A resposta antiga vazava o regex interno do validador.
 */

import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError } from "zod"
import config from "../config/app"

// O Fastify chama esta função sempre que alguma rota estoura um erro
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Erro de validação pode chegar de duas formas:
  // 1. O Fastify já embrulhou num FST_ERR_VALIDATION (é o caso normal das rotas com schema)
  // 2. Um ZodError cru, quando a gente valida algo na mão dentro de um service
  if (error.validation) {
    return handleFastifyValidationError(error, reply)
  }

  if (error instanceof ZodError) {
    return handleZodError(error, reply)
  }

  // Se for qualquer outro erro, cai aqui no tratamento genérico
  return handleGenericError(error, request, reply)
}

// Trata o erro de validação que o Fastify monta a partir dos nossos schemas Zod.
// A mensagem crua dele vem tipo "body/email Email com formato errado" e traz o regex
// inteiro dentro de params, então a gente reescreve num formato limpo pro front.
function handleFastifyValidationError(error: FastifyError, reply: FastifyReply) {
  const details = (error.validation ?? []).map((issue) => ({
    // instancePath vem como "/email"; a gente tira a barra pra virar só "email"
    path: String(issue.instancePath || "").replace(/^\//, "").replace(/\//g, "."),
    message: issue.message || "Campo inválido",
  }))

  return reply.status(400).send({
    error: "ValidationError",
    message: "Alguns campos vieram errados, confere a lista aí",
    details,
  })
}

// Trata o ZodError cru (quando a validação não passou pelo schema da rota)
function handleZodError(error: ZodError, reply: FastifyReply) {
  // Pega cada problema de validação e monta uma lista organizada
  // No Zod 4 a lista se chama "issues" (no Zod 3 era "errors")
  const details = error.issues.map((issue) => ({
    path: issue.path.join("."), // Junta o caminho do campo (ex: "user.email")
    message: issue.message, // Mensagem de erro (ex: "Email inválido")
  }))

  // Manda a resposta de erro formatada (400 - Bad Request)
  return reply.status(400).send({
    error: "ValidationError",
    message: "Alguns campos vieram errados, confere a lista aí",
    details,
  })
}

function handleGenericError(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Define o código HTTP: se tiver no erro, usa; senão, 500 (erro interno)
  const statusCode = error.statusCode || 500

  // Erro nosso (4xx) a gente pode mostrar; erro de servidor (5xx) a gente esconde,
  // porque a mensagem pode conter detalhe do banco que o usuário não deve ver
  const isServerError = statusCode >= 500

  // Loga sempre: em desenvolvimento com stack completa, em produção só o essencial
  logError(error, request, statusCode)

  return reply.status(statusCode).send({
    error: error.code || (isServerError ? "InternalServerError" : "RequestError"),
    message: isServerError
      ? "Opa, deu um erro inesperado do nosso lado! Tenta de novo ou fala com o suporte"
      : error.message,
  })
}

function logError(error: FastifyError, request: FastifyRequest, statusCode: number) {
  // Em desenvolvimento a gente quer tudo pra debugar
  if (config.ENVIRONMENT === "development") {
    console.error({
      statusCode,
      method: request.method,
      url: request.url,
      error: error.message,
      stack: error.stack,
    })
    return
  }

  // Em produção, só uma linha por erro (sem stack, pra não encher o log)
  console.error(`[${statusCode}] ${request.method} ${request.url} - ${error.message}`)
}
