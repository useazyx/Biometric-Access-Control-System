/**
 * CreateEmployeeController.ts - Cuida do cadastro de funcionários no sistema
 * # Pra que serve?
 * - Recebe os dados de um novo funcionário e valida
 * - Salva no banco se tudo estiver certo e avisa o front
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-06-25 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-20): Cadastro básico de funcionários
 * - v1.1.0 (2025-06-22): Validação de matrícula única
 * - v1.2.0 (2025-06-25): Integração com sistema de folha de pagamento
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { CreateEmployeeService } from "../../services/employees/CreateEmployeeService";

// Como devem vir os dados da requisição? (o que a gente espera do front)
interface CreateEmployeeBody {
  cpf: string;
  role_id: number;
  registration_number: string;
  admission_date?: string;
}

// Cuida de todo o processo de cadastro de um funcionário (desde a validação até salvar)
export class CreateEmployeeController {
  // Processa o pedido de cadastro de funcionário

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateEmployeeBody;

    // Valida a data de admissão: precisa ser uma data válida e não pode ser no futuro
    const admissionDate = this.validateAdmissionDate(body.admission_date);
    if (admissionDate instanceof Error) {
      // Se a data for inválida, já responde com erro
      return reply.status(400).send({
        error:
          admissionDate.message === "Formato de data inválido"
            ? "InvalidAdmissionDate"
            : "FutureAdmissionDate",
        message: admissionDate.message,
      });
    }

    try {
      // Manda o serviço criar o funcionário (ele que fala com o banco)
      const service = new CreateEmployeeService();
      const employee = await service.execute({
        cpf: body.cpf,
        role_id: body.role_id,
        registration_number: body.registration_number,
        admission_date: admissionDate,
      });

      // Se deu tudo certo, monta a resposta bonitinha
      return reply.status(201).send({
        id: employee.id,
        message: "Funcionário cadastrado com sucesso!",
        employee: {
          id: employee.id,
          registration_number: employee.registration_number,
          person_id: employee.person_id,
        },
      });
    } catch (error: any) {
      // Se deu erro, vê qual foi e manda a resposta certa
      switch (error.message) {
        case "Pessoa não encontrada":
          // CPF não tá cadastrado no sistema
          return reply.status(404).send({
            error: "PersonNotFound",
            message: "Cadastra essa pessoa primeiro! CPF não encontrado",
          });
        case "Esta pessoa já está cadastrada como funcionário":
          // Tentou cadastrar o mesmo CPF duas vezes
          return reply.status(409).send({
            error: "DuplicateEmployee",
            message: "Opa, esse CPF já é funcionário!",
          });
        case "Cargo não encontrado":
          // ID do cargo não existe
          return reply.status(404).send({
            error: "RoleNotFound",
            message: "Esse cargo não existe! Cadastra ele antes",
          });
        default:
          // Erro inesperado (banco, rede, etc.)
          console.error("CreateEmployeeError:", error);
          return reply.status(500).send({
            error: "InternalServerError",
            message: "Deu ruim no cadastro! Tenta de novo?",
          });
      }
    }
  }

  // Valida a data de admissão: converte a string pra data e checa se é válida e não é futura
  private validateAdmissionDate(admissionDateStr?: string): Date | Error {
    // Se não veio data, retorna undefined (mas de um jeito que o TypeScript entenda)
    if (!admissionDateStr) return undefined as unknown as Date;

    const admissionDate = new Date(admissionDateStr);

    // Se a data for inválida (tipo '31 de fevereiro'), retorna erro
    if (isNaN(admissionDate.getTime())) {
      return new Error("Formato de data inválido");
    }

    // Pega o dia de hoje (sem horas) pra comparar
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Se a data de admissão for depois de hoje, não vale
    if (admissionDate > today) {
      return new Error("Data de admissão não pode ser futura");
    }

    return admissionDate;
  }
}
