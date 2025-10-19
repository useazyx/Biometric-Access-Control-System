/**
 * CreateTeacherService.ts - Serviço de cadastro de professores
 * # Pra que serve?
 * - Validar dados de professores
 * - Persistir registros de docentes
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-07-15 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-08): Cadastro básico de professores
 * - v1.1.0 (2025-06-25): Validação de vínculo empregatício
 * - v1.2.0 (2025-07-15): Suporte a múltiplas disciplinas e unidades de atuação
 */

import { prisma } from "../../config/prisma";
import { Person, Employee } from "@prisma/client";

interface CreateTeacherRequest {
  cpf: string;
  subjects: string[];
  canTeachFatec: boolean;
  canTeachEtec: boolean;
}

interface TeacherResult {
  id: number;
  employee_id: number;
  subjects: string[];
}

// Tipo para pessoa com funcionário garantido
interface PersonWithEmployee extends Person {
  employee: Employee;
}

// Executar cadastro de professor

export class CreateTeacherService {
  async execute(request: CreateTeacherRequest): Promise<TeacherResult> {
    // Buscar pessoa com vínculo empregatício
    const person = await this.getPersonWithEmployee(request.cpf);

    // Validar se é funcionário ativo
    this.validateEmployeeStatus(person);

    // Verificar duplicidade de professor
    await this.checkExistingTeacher(person.employee.id);

    // Criar registro de professor
    return this.createTeacher({
      employeeId: person.employee.id,
      subjects: request.subjects,
      canTeachFatec: request.canTeachFatec,
      canTeachEtec: request.canTeachEtec,
    });
  }

  // Obter pessoa com vínculo empregatício

  private async getPersonWithEmployee(
    cpf: string
  ): Promise<PersonWithEmployee> {
    // Busca pessoa incluindo relação employee
    const person = await prisma.person.findUnique({
      where: { cpf },
      include: { employee: true },
    });

    if (!person) {
      throw new Error("Pessoa não encontrada");
    }

    // Retorna como PersonWithEmployee (garante que employee existe)
    return person as PersonWithEmployee;
  }

  // Validar status de funcionário

  private validateEmployeeStatus(person: PersonWithEmployee) {
    // Verificação adicional de segurança
    if (!person.employee) {
      throw new Error("Esta pessoa não é um funcionário");
    }
  }

  // Verificar professor existente

  private async checkExistingTeacher(employeeId: number) {
    // Busca professor pelo ID do funcionário (chave única)
    const existingTeacher = await prisma.teacher.findUnique({
      where: { employee_id: employeeId },
    });

    if (existingTeacher) {
      throw new Error("Este funcionário já está cadastrado como professor");
    }
  }

  // Criar registro de professor

  private async createTeacher(params: {
    employeeId: number;
    subjects: string[];
    canTeachFatec: boolean;
    canTeachEtec: boolean;
  }): Promise<TeacherResult> {
    // Criação do registro no banco de dados
    const teacher = await prisma.teacher.create({
      data: {
        subjects: params.subjects,
        can_teach_fatec: params.canTeachFatec,
        can_teach_etec: params.canTeachEtec,
        employee_id: params.employeeId,
      },
    });

    // Retorna apenas campos essenciais para resposta
    return {
      id: teacher.id,
      employee_id: teacher.employee_id,
      subjects: teacher.subjects,
    };
  }
}
