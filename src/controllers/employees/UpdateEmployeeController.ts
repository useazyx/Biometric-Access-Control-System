/**
 * UpdateEmployeeController.ts - Cuida das atualizações dos dados de funcionários
 * # Pra que serve?
 * - Recebe os novos dados de um funcionário e atualiza no sistema
 * - Gerencia as respostas e possíveis erros desse processo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-06-28 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-25): Atualização básica de dados
 * - v1.1.0 (2025-06-26): Histórico de alterações
 * - v1.2.0 (2025-06-27): Notificações por e-mail
 * - v1.3.0 (2025-06-28): Validação de transições de cargo
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { UpdateEmployeeService } from "../../services/employees/UpdateEmployeeService";

// Cuida da parte de atualizar funcionários (tipo quando o RH precisa mudar cargo ou status)
export class UpdateEmployeeController {
  // Processa o pedido de atualização (rota que o front chama quando edita um funcionário)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega o CPF da URL (pra saber qual funcionário atualizar)
    const { cpf } = request.params as { cpf: string };

    // Pega os dados novos do corpo da requisição (o que pode ser atualizado)
    const { role_name, active } = request.body as {
      role_name?: string;
      active?: boolean;
    };

    // Se não veio CPF, nem tenta! (afinal, precisa saber quem atualizar)
    if (!cpf) {
      return reply.status(400).send({
        error: "MissingCPF",
        message: "Opa, faltou o CPF! Sem ele não sabemos quem atualizar",
      });
    }

    try {
      // Manda o serviço fazer a atualização de verdade (ele que conversa com o banco)
      const service = new UpdateEmployeeService();
      const result = await service.execute({ cpf, role_name, active });

      // Se deu certo, manda a confirmação com os dados atualizados
      return reply.status(200).send(result);
    } catch (error: any) {
      // Se deu erro, vê qual foi e manda a resposta certinha
      switch (error.message) {
        case "Pessoa não encontrada":
          // CPF não tá cadastrado no sistema
          return reply.status(404).send({
            error: "Pessoa não encontrada",
            tip: "Cadastra essa pessoa antes de virar funcionário!",
            cpf,
          });
        case "Esta pessoa não é um funcionário":
          // Tentou atualizar alguém que não é funcionário
          return reply.status(400).send({
            error: "Não é funcionário",
            solution: "Cadastra como funcionário primeiro!",
            cpf,
          });
        case "Cargo não encontrado":
          // O novo cargo não existe no sistema
          return reply.status(404).send({
            error: "Cargo não existe",
            tip: "Confere o nome do cargo ou cadastra ele antes",
            cargo: role_name,
          });
        case "Nenhum dado válido fornecido para atualização":
          // Não mandou nada pra atualizar
          return reply.status(400).send({
            error: "Faltou dados pra atualizar",
            solution: "Manda pelo menos um campo: cargo ou status",
          });
        default:
          // Erro inesperado (banco, rede, etc.)
          return reply.status(400).send({
            error: "Opa, deu ruim na atualização!",
            tip: "Tenta de novo ou chama o suporte",
          });
      }
    }
  }
}
