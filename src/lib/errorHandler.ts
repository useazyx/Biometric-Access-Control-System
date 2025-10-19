/**
 * errorHandler.ts - Centralizador de tratamento de erros
 * # Pra que serve?
 * - Capturar todos os erros que acontecem na aplicação
 * - Responder pro cliente de um jeito padronizado e útil
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-04-15 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-18): Tratamento básico de erros
 * - v1.1.0 (2025-03-25): Adicionado tratamento especial para erros Zod
 * - v1.2.0 (2025-04-01): Logs detalhados em ambiente de desenvolvimento
 * - v1.3.0 (2025-04-08): Padronização de respostas de erro
 * - v1.4.0 (2025-04-15): Suporte a erros customizados do domínio
 */

import { FastifyError, FastifyReply } from "fastify";
import { ZodError } from "zod";
import config from "../config/app";

export function errorHandler(error: FastifyError, reply: FastifyReply) {
  // Se o erro for de validação (Zod), trata de um jeito especial
  if (error instanceof ZodError) {
    return handleValidationError(error, reply);
  }

  // Se for qualquer outro erro, cai aqui no tratamento genérico
  handleGenericError(error, reply);
}

function handleValidationError(error: ZodError, reply: FastifyReply) {
  // Pega cada erro de validação e monta uma lista organizada
  const details = error.errors.map((e) => ({
    path: e.path.join("."), // Junta o caminho do campo (ex: "user.email")
    message: e.message, // Mensagem de erro (ex: "Email inválido")
  }));

  // Manda a resposta de erro formatada (400 - Bad Request)
  reply.status(400).send({
    error: "Erro de validação",
    details,
  });
}

function handleGenericError(error: FastifyError, reply: FastifyReply) {
  // Define o código HTTP: se tiver no erro, usa; senão, 500 (erro interno)
  const statusCode = error.statusCode || 500;

  // Monta o corpo da resposta de erro
  const response = buildErrorResponse(error);

  // Se tiver no ambiente de desenvolvimento, loga tudo pra ajudar no debug
  if (config.ENVIRONMENT === "development") {
    logDevelopmentError(error, statusCode);
  }

  // Envia a resposta pro cliente
  reply.status(statusCode).send(response);
}

function buildErrorResponse(error: FastifyError) {
  // Base da resposta de erro (o que sempre vem)
  const response: Record<string, any> = {
    error: error.message || "Erro interno do servidor",
    code: error.code || "INTERNAL_SERVER_ERROR",
  };

  // Se tiver detalhes de validação extra (do Fastify), coloca na resposta
  if (error.validation) {
    response.validation = error.validation;
  }

  return response;
}

function logDevelopmentError(error: FastifyError, statusCode: number) {
  // Log completo pra gente debugar - só aparece em desenvolvimento
  console.error({
    statusCode,
    error: error.message,
    stack: error.stack,
    validation: error.validation,
  });
}
