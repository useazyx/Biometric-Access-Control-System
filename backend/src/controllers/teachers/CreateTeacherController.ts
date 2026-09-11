/**
 * CreateTeacherController.ts - Cuida dos dados para atualizar um professor no sistema
 * # Pra que serve?
 * - Receber a requisição de criar professor e mandar pro serviço
 * - Lidar com a resposta (sucesso ou erro) e retornar pro cliente
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-06-22 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-10): Cadastro básico de professores
 * - v1.1.0 (2025-06-15): Validação de matérias
 * - v1.2.0 (2025-06-18): Suporte a múltiplas unidades
 * - v1.3.0 (2025-06-22): Integração com sistema de horários
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { CreateTeacherService } from "../../services/teachers/CreateTeacherService";

// Define o formato dos dados que a gente espera receber na requisição

interface CreateTeacherBody {
  cpf: string;
  subjects: string[];
  can_teach_fatec: boolean;
  can_teach_etec: boolean;
}
// Gerencia a criação de professor: manipula todo o processo, desde receber a requisição até responder se deu certo ou não.

export class CreateTeacherController {
  // Lida com a requisição de cadastrar um professor

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os dados do corpo da requisição (o que o usuário mandou)
    const body = request.body as CreateTeacherBody;

    try {
      // Chama o serviço que faz a criação do professor no banco
      const service = new CreateTeacherService();
      const teacher = await service.execute({
        cpf: body.cpf,
        subjects: body.subjects,
        canTeachFatec: body.can_teach_fatec,
        canTeachEtec: body.can_teach_etec,
      });

      // Se tudo der certo, monta a resposta de sucesso (código 201: criado)
      return reply.status(201).send({
        id: teacher.id,
        message: "Professor cadastrado com sucesso",
        teacher: {
          id: teacher.id,
          employee_id: teacher.employee_id,
          subjects: teacher.subjects,
        },
      });
    } catch (error: any) {
      // Se der erro, a gente trata aqui e manda a resposta certinha
      switch (error.message) {
        case "Pessoa não encontrada":
          return reply.status(404).send({ error: error.message });
        case "Esta pessoa não é um funcionário":
          return reply.status(400).send({
            error: "A pessoa deve ser funcionário antes de se tornar professor",
            solution: "Cadastre-a como funcionário primeiro",
          });
        case "Este funcionário já está cadastrado como professor":
          return reply.status(409).send({ error: error.message });
        default:
          // Se for um erro inesperado, manda uma mensagem genérica (mas já logamos internamente)
          return reply
            .status(400)
            .send({ error: "Erro ao cadastrar professor" });
      }
    }
  }
}
