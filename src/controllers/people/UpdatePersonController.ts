/**
 * UpdatePersonController.ts - Cuida das atualizações dos dados de uma pessoa
 * # Pra que serve?
 * - Recebe as mudanças que queremos fazer nos dados de alguém (nome, email, etc.)
 * - Gerencia o processo de atualização e responde se deu certo ou não
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.5.0
 * Data: 2025-06-25 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-20): Atualização básica de dados
 * - v1.1.0 (2025-05-30): Validação de email único
 * - v1.2.0 (2025-06-10): Histórico de alterações
 * - v1.3.0 (2025-06-18): Notificações por e-mail
 * - v1.4.0 (2025-06-25): Suporte a atualizações parciais
 * - v1.5.0 (2025-07-20): Recebe CPF via JSON body
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { UpdatePersonService } from "../../services/people/UpdatePersonService";

// Cuida de atualizar os dados de uma pessoa (tipo quando ela muda o telefone ou email)
export class UpdatePersonController {
  // Processa o pedido de atualização (rota que o front chama pra atualizar alguém)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os dados do corpo da requisição (CPF e campos atualizáveis)
    const body = request.body as {
      cpf: string;
      full_name?: string;
      email?: string;
      phone?: string;
    };

    const cpf = body?.cpf;
    const full_name = body?.full_name;
    const email = body?.email;
    const phone = body?.phone;

    // Se não veio CPF, nem tenta! (afinal, precisa saber quem atualizar)
    if (!cpf) {
      return reply.status(400).send({
        error: "MissingCPF",
        message: "Opa, faltou o CPF! Sem ele não sabemos quem atualizar",
      });
    }

    try {
      // Manda o serviço fazer a atualização (ele que conversa com o banco)
      const service = new UpdatePersonService();
      const result = await service.execute({
        cpf,
        full_name,
        email,
        phone,
      });

      // Se deu certo, manda os dados atualizados de volta
      return reply.status(200).send({
        ...result,
        message: "Dados atualizados com sucesso!",
      });
    } catch (error: any) {
      // Se deu erro, vê qual foi e manda a resposta certinha
      switch (error.message) {
        case "Pessoa não encontrada":
          // CPF não tá cadastrado no sistema
          return reply.status(404).send({
            error: "Pessoa não encontrada",
            tip: "Confere esse CPF aí, não achamos ninguém",
            cpf,
          });
        case "Nenhum campo válido fornecido para atualização":
          // Não mandou nada pra atualizar
          return reply.status(400).send({
            error: "Faltou dados pra atualizar",
            solution: "Manda pelo menos um campo: nome, email ou telefone",
          });
        default:
          // Qualquer outro erro (banco, rede, etc.)
          return reply.status(400).send({
            error: "Opa, deu ruim na atualização!",
            tip: "Tenta de novo ou fala com o suporte",
          });
      }
    }
  }
}