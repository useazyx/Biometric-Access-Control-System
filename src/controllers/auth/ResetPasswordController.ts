/**
 * ResetPasswordController.ts - Cuida da troca de senha quando o usuário esqueceu a antiga
 * # Pra que serve?
 * - Valida os dados que o usuário enviou pra trocar a senha
 * - Atualiza a senha no sistema se tudo estiver certo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-05-25 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-15): Fluxo básico de reset
 * - v1.1.0 (2025-05-18): Validação de complexidade de senha
 * - v1.2.0 (2025-05-22): Expiração de tokens
 * - v1.3.0 (2025-05-25): Limite de tentativas
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { ResetPasswordService } from "../../services/auth/ResetPasswordService";

// Cuida do processo de "esqueci minha senha" (quando o usuário precisa criar uma nova)
export class ResetPasswordController {
  // Processa a requisição de troca de senha (rota que o front chama quando o usuário preenche o formulário)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      email: string;
      token: string;
      new_password: string;
    };

    // Primeiro: verifica se veio tudo que a gente precisa (email, token e senha nova)
    // Se faltar alguma coisa, já avisa o front
    if (!body.email || !body.token || !body.new_password) {
      return reply.status(400).send({
        error: "MissingParameters",
        details: "Faltou coisa! Precisa do email, token e senha nova",
      });
    }

    // Chama o serviço que vai fazer a troca de verdade (ele que verifica se o token tá certo, etc.)
    const resetPasswordService = new ResetPasswordService();
    try {
      // Tenta trocar a senha (se der certo, manda mensagem de sucesso)
      const result = await resetPasswordService.execute(
        body.email,
        body.token,
        body.new_password
      );
      return reply.status(200).send(result);
    } catch (error) {
      // Se deu erro, vê o que foi e manda a resposta certinha
      if (error instanceof Error) {
        // Erro conhecido (token inválido, email errado, etc.)
        return reply.status(400).send({
          error: "ResetPasswordError",
          details: error.message,
        });
      }

      // Se foi um erro que a gente não esperava, manda um genérico
      return reply.status(500).send({
        error: "InternalServerError",
        details: "Opa, deu um erro inesperado! Tenta de novo mais tarde!",
      });
    }
  }
}
