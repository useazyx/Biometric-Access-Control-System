/**
 * LogoutController.ts - controla o logout do usuário/fecha a sessão dele com segurança
 * # Pra que serve?
 * - Recebe pedidos de logout e encerra as sessões ativas
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-05-22 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-12): Implementação básica do logout
 * - v1.1.0 (2025-05-15): Registro de tempo de sessão
 * - v1.2.0 (2025-05-22): Validação de múltiplas sessões
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { LogoutService } from "../../services/auth/LogoutService";
// Coordena o processo de logout - garante que o acesso é finalizado com segurança

export class LogoutController {
  // Lida com o pedido de logout: recebe os dados e responde

  async handle(req: FastifyRequest, rep: FastifyReply) {
    // Pega o ID do log de acesso que veio no corpo da requisição
    const { access_log_id } = req.body as { access_log_id: number };

    // Pega o usuário que já tá autenticado (a gente botou ele na requisição antes)
    const user = (req as any).user;

    try {
      // Manda fazer o logout de fato (chama o serviço que cuida disso)
      const result = await this.performLogout(user, access_log_id);

      // Se tudo der certo, avisa que deu bom! 👌
      return rep.send(result);
    } catch (error) {
      // Se der ruim, a gente trata o erro com carinho
      this.handleLogoutError(error, rep);
    }
  }

  private async performLogout(user: any, access_log_id: number) {
    const logoutService = new LogoutService();
    return await logoutService.execute({
      user_id: user.id,
      unit_id: user.unit_id,
      access_log_id,
    });
  }

  // Lida com os erros que podem dar no logout

  private handleLogoutError(error: any, rep: FastifyReply) {
    console.error("LogoutError:", error);

    // Se o erro for porque não achou o log de entrada, manda um 404 (não encontrado)
    if (error.message === "Log de entrada não encontrado") {
      return rep.status(404).send({
        error: "EntryLogNotFound",
        message: "Registro de login não encontrado",
      });
    }

    // Se for outro erro qualquer, manda um 500 (problema nosso no servidor)
    return rep.status(500).send({
      error: "InternalServerError",
      message: "Erro durante o processo de logout",
    });
  }
}
