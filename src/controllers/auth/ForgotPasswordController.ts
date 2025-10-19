/**
 * ForgotPasswordController.ts - Cuida da solicitação de reset de senha
 * # Pra que serve?
 * - Receber solicitações de "esqueci minha senha"
 * - Validar os dados e chamar o serviço apropriado
 * - Retornar resposta adequada para o frontend
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-07-25 (Criado)
 * Alterações:
 * - v1.0.0 (2025-07-25): Implementação inicial do controller
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { ForgotPasswordService } from "../../services/auth/ForgotPasswordService";

// Cuida do processo de "esqueci minha senha" (quando o usuário quer resetar)
export class ForgotPasswordController {
  // Processa a requisição de esqueci senha (rota que o front chama)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      email: string;
    };

    // Primeiro: verifica se veio o email
    if (!body.email) {
      return reply.status(400).send({
        error: "MissingParameters",
        message: "Email é obrigatório",
      });
    }

    // Chama o serviço que vai gerar o token e mandar o email
    const forgotPasswordService = new ForgotPasswordService();
    try {
      // Tenta processar a solicitação
      const result = await forgotPasswordService.execute({
        email: body.email,
      });
      
      return reply.status(200).send(result);
    } catch (error) {
      // Se deu erro, vê o que foi e manda a resposta certinha
      if (error instanceof Error) {
        // Erro conhecido (usuário não encontrado, tipo não permitido, etc.)
        return reply.status(400).send({
          error: "ForgotPasswordError",
          message: error.message,
        });
      }

      // Se foi um erro que a gente não esperava, manda um genérico
      return reply.status(500).send({
        error: "InternalServerError",
        message: "Erro inesperado ao processar solicitação",
      });
    }
  }
}

