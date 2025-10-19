/**
 * CreateStudentController.ts - Cuida do cadastro de alunos no sistema
 * # Pra que serve?
 * - Recebe os dados de um novo aluno e salva no sistema
 * - Gerencia as respostas e trata erros que podem acontecer
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-06-28 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-15): Cadastro básico de alunos
 * - v1.1.0 (2025-06-20): Validação de RM único
 * - v1.2.0 (2025-06-25): Integração com sistema acadêmico
 * - v1.3.0 (2025-06-28): Controle de status do aluno
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { CreateStudentService } from "../../services/students/CreateStudentService";
import { Period } from "@prisma/client";

// Como devem vir os dados da requisição? (o que a gente espera do front)
interface CreateStudentBody {
  cpf: string;
  rm: string;
  period: Period;
  course: string;
  class: string;
  responsible: string;
}

// Cuida de todo o processo de cadastro de um aluno (valida e salva)
export class CreateStudentController {
  // Processa o pedido de cadastro de aluno (rota que o RH ou secretaria usa)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega todos os dados do corpo da requisição
    const body = request.body as CreateStudentBody;

    try {
      // Manda o serviço criar o aluno (ele que fala com o banco de dados)
      const service = new CreateStudentService();
      const student = await service.execute({
        cpf: body.cpf,
        rm: body.rm,
        period: body.period,
        course: body.course,
        className: body.class,
        responsible: body.responsible,
      });

      // Se deu tudo certo, monta a resposta bonitinha
      return reply.status(201).send({
        id: student.id,
        message: "Aluno cadastrado com sucesso!",
        student: {
          id: student.id,
          rm: student.rm,
          person_id: student.person_id,
        },
      });
    } catch (error: any) {
      // Se deu erro, vê qual foi e manda a resposta adequada
      switch (error.message) {
        case "Pessoa não encontrada":
          // CPF não tá cadastrado no sistema
          return reply.status(404).send({
            error: "Pessoa não encontrada",
            tip: "Cadastra essa pessoa primeiro! CPF não existe no sistema",
          });
        case "Esta pessoa já está cadastrada como estudante":
          // Tentou cadastrar o mesmo CPF como aluno duas vezes
          return reply.status(409).send({
            error: "Aluno já cadastrado",
            solution: "Esse CPF já é aluno! Atualiza os dados se precisar",
          });
        case "RM já cadastrado para outro estudante":
          // Número de matrícula tá sendo usado por outro aluno
          return reply.status(409).send({
            error: "Matrícula duplicada",
            solution: "Esse RM já tá sendo usado! Confere o número",
          });
        default:
          // Qualquer outro erro inesperado
          return reply.status(400).send({
            error: "Opa, não consegui cadastrar o aluno!",
            tip: "Tenta de novo ou fala com o suporte",
          });
      }
    }
  }
}
