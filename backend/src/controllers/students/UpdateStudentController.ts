/**
 * UpdateStudentController.ts - Cuida dos dados para atualizar um aluno no sistema
 * # Pra que serve?
 * - Receber a requisição de atualização e mandar pro serviço
 * - Lidar com a resposta (sucesso ou erro) e retornar pro cliente
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-07-01 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-25): Atualização básica de dados
 * - v1.1.0 (2025-06-28): Controle de histórico acadêmico
 * - v1.2.0 (2025-07-01): Notificação de responsáveis
 * - v1.3.0 (2025-07-20): Recebe RM via JSON body
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { UpdateStudentService } from "../../services/students/UpdateStudentService";
import { Period, StudentStatus } from "@prisma/client";

// Gerencia a atualização de estudante: manipula todo o processo, desde receber a requisição até responder se deu certo ou não.

export class UpdateStudentController {
  // Lida com a requisição de atualizar um estudante

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os dados do corpo da requisição (incluindo RM do estudante)
    const body = request.body as {
      rm: string;
      period?: Period;
      course?: string;
      class?: string;
      status?: StudentStatus;
      responsible?: string;
    };

    const rm = body?.rm;
    const period = body?.period;
    const course = body?.course;
    const className = body?.class;
    const status = body?.status;
    const responsible = body?.responsible;

    // Se não tiver RM, já barra aqui mesmo (pq é obrigatório)
    if (!rm) {
      return reply.status(400).send({
        error: "MissingRM",
        message: "O RM é obrigatório",
      });
    }

    try {
      // Chama o serviço que faz a atualização no banco
      const service = new UpdateStudentService();
      const updatedStudent = await service.execute({
        rm,
        period,
        course,
        className,
        status,
        responsible,
      });

      // Se tudo der certo, avisa que atualizou e retorna o estudante (só id e RM)
      return reply.status(200).send({
        message: "Estudante atualizado com sucesso",
        updated_student: {
          id: updatedStudent.id,
          rm: updatedStudent.rm,
        },
      });
    } catch (error: any) {
      // Se der erro, a gente trata aqui e manda a resposta certinha
      switch (error.message) {
        case "Estudante não encontrado":
          return reply.status(404).send({
            error: "Estudante não encontrado",
            rm,
          });
        case "Nenhum dado válido fornecido para atualização":
          return reply.status(400).send({
            error: "Nenhum dado válido fornecido para atualização",
          });
        default:
          return reply
            .status(400)
            .send({ error: "Erro ao atualizar estudante" });
      }
    }
  }
}