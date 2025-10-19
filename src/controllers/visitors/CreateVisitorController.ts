/**
 * CreateVisitorController.ts - Cuida dos dados para a criação de visitantes
 * # Pra que serve?
 * - Receber os dados do visitante e mandar pro serviço
 * - Lidar com a resposta (sucesso ou erro) e responder pro cliente
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-06-30 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-15): Cadastro básico de visitantes
 * - v1.1.0 (2025-06-20): Validação de responsáveis
 * - v1.2.0 (2025-06-25): Controle de datas de expiração
 * - v1.3.0 (2025-06-28): Notificações de segurança
 * - v1.4.0 (2025-06-30): Integração com sistema de credenciais
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { CreateVisitorService } from "../../services/visitors/CreateVisitorService";

// Formato esperado dos dados do visitante:

interface CreateVisitorBody {
  cpf: string;
  company?: string;
  visit_reason?: string;
  responsible_employee_cpf: string;
}

export class CreateVisitorController {
  // Lida com o cadastro de visitante: recebe os dados, valida e responde

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os dados do corpo da requisição (o que o usuário enviou)
    const body = request.body as CreateVisitorBody;

    try {
      // Chama o serviço que faz o cadastro no banco de dados
      const service = new CreateVisitorService();
      const visitor = await service.execute({
        cpf: body.cpf,
        responsibleEmployeeCpf: body.responsible_employee_cpf,
        company: body.company,
        visitReason: body.visit_reason,
      });

      // Se deu certo, monta a resposta de sucesso (código 201 - criado)
      return reply.status(201).send({
        id: visitor.id,
        message: "Visitante cadastrado com sucesso",
        visitor: {
          id: visitor.id,
          person_id: visitor.person_id,
        },
      });
    } catch (error: any) {
      // Se der erro, trata cada caso específico e manda a resposta certinha
      switch (error.message) {
        case "Pessoa não encontrada":
          return reply.status(404).send({ error: error.message });
        case "Esta pessoa não está cadastrada como visitante":
          return reply.status(400).send({
            error: "A pessoa deve ser cadastrada como visitante primeiro",
            solution:
              "Atualize o tipo da pessoa para 'visitor' antes de cadastrar os detalhes",
          });
        case "Funcionário responsável não encontrado":
          return reply.status(404).send({
            error: error.message,
            solution:
              "Verifique se o CPF está correto e se o funcionário está cadastrado",
          });
        case "Esta pessoa já está cadastrada como visitante":
          return reply.status(409).send({ error: error.message });
        default:
          // Se for um erro desconhecido, manda resposta genérica
          return reply
            .status(400)
            .send({ error: "Erro ao cadastrar visitante" });
      }
    }
  }
}
