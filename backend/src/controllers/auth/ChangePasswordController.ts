/**
 * ChangePasswordController.ts - Cuida da troca de senha para usuários logados
 * # Pra que serve?
 * - Receber solicitações de troca de senha
 * - Validar os dados e chamar o serviço apropriado
 * - Retornar resposta adequada para o frontend
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-07-25 (Criado)
 * Alterações:
 * - v1.0.0 (2025-07-25): Implementação inicial do controller
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { ChangePasswordService } from "../../services/auth/ChangePasswordService";

// Cuida do processo de troca de senha para usuários logados
export class ChangePasswordController {
  // Processa a requisição de troca de senha

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      current_password: string;
      new_password: string;
      new_password_confirm: string;
    };

    // Primeiro: verifica se veio tudo que a gente precisa
    if (!body.current_password || !body.new_password || !body.new_password_confirm) {
      return reply.status(400).send({
        error: "MissingParameters",
        message: "Senha atual, nova senha e confirmação são obrigatórias",
      });
    }

    // Verifica se as senhas novas batem
    if (body.new_password !== body.new_password_confirm) {
      return reply.status(400).send({
        error: "PasswordMismatch",
        message: "Nova senha e confirmação não coincidem",
      });
    }

    // Pega o ID do usuário logado (vem do middleware de auth)
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Usuário não autenticado",
      });
    }

    // Chama o serviço que vai fazer a troca
    const changePasswordService = new ChangePasswordService();
    try {
      // Tenta trocar a senha
      const result = await changePasswordService.execute({
        userId,
        currentPassword: body.current_password,
        newPassword: body.new_password,
      });
      
      return reply.status(200).send(result);
    } catch (error) {
      // Se deu erro, vê o que foi e manda a resposta certinha
      if (error instanceof Error) {
        // Erro conhecido (senha atual incorreta, senha fraca, etc.)
        return reply.status(400).send({
          error: "ChangePasswordError",
          message: error.message,
        });
      }

      // Se foi um erro que a gente não esperava, manda um genérico
      return reply.status(500).send({
        error: "InternalServerError",
        message: "Erro inesperado ao alterar senha",
      });
    }
  }
}

