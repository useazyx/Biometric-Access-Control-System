/**
 * fastify.d.ts - Aumenta os tipos do Fastify com nossas extensões
 * # Pra que serve?
 * - Coloca mais informações nas definições de tipo do Fastify
 * - Adiciona propriedades customizadas no Request e Reply
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2025-04-05 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-12): Definição inicial dos tipos extendidos
 * - v1.1.0 (2025-04-05): Adicionado tokenId e unitId ao user object
 */

import { Person } from "@prisma/client";

declare module "fastify" {
  // A gente coloca um usuário logado dentro do Request, pra ter sempre à mão as info do usuário autenticado
  interface FastifyRequest {
    user?: {
      id: number;
      tokenId: number;
      personId: number;
      unitId: number;
      type: string;
    };
  }

  // A gente coloca métodos padrão no Reply pra responder as requisições, pra não ficar repetindo código em toda resposta

  interface FastifyReply {
    // Manda uma resposta de sucesso
    success: (data?: any, code?: number) => FastifyReply;
    // Manda uma resposta de erro
    error: (message: string, code?: number, details?: any) => FastifyReply;
  }
}
