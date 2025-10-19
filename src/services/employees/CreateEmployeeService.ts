/**
 * CreateEmployeeService.ts - O cadastrador de funcionários: registra novos colaboradores
 * # Pra que serve?
 * - Validar os dados antes de cadastrar
 * - Garantir que tudo tá certo antes de salvar no banco
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-07-15 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-07-05): Cadastro básico de funcionários
 * - v1.1.0 (2025-07-10): Validação de pessoa existente
 * - v1.2.0 (2025-07-15): Verificação de duplicidade de funcionário
 */

import { prisma } from "../../config/prisma";

// O que a gente precisa pra cadastrar um funcionário:
interface CreateEmployeeRequest {
  cpf: string;
  role_id: number;
  registration_number: string;
  admission_date?: Date;
}

// O que a gente devolve quando cadastra:
interface EmployeeResult {
  id: number;
  registration_number: string;
  person_id: number;
}

// Serviço que cadastra funcionários - tipo o RH digital

export class CreateEmployeeService {
  // Faz todo o processo de cadastrar um funcionário

  async execute(data: CreateEmployeeRequest): Promise<EmployeeResult> {
    // Passo a passo das validações:
    // 1. Confere se a pessoa já existe no sistema
    const person = await this.validatePerson(data.cpf);
    // 2. Verifica se ela já não tá cadastrada como funcionária
    await this.checkExistingEmployee(person.id);
    // 3. Checa se o cargo existe
    await this.validateRole(data.role_id);

    // Se passou nas validações, cria o registro
    return this.createEmployee({
      personId: person.id,
      roleId: data.role_id,
      registrationNumber: data.registration_number,
      admissionDate: data.admission_date,
    });
  }

  // Confere se a pessoa existe no banco de dados

  private async validatePerson(cpf: string) {
    // Busca a pessoa pelo CPF (que é único)
    const person = await prisma.person.findUnique({ where: { cpf } });
    // Se não achou, não tem como cadastrar como funcionário
    if (!person) throw new Error("Pessoa não encontrada");
    return person;
  }

  // Verifica se a pessoa já não é funcionária

  private async checkExistingEmployee(personId: number) {
    // Procura se já existe cadastro dela como funcionária
    const existingEmployee = await prisma.employee.findFirst({
      where: { person_id: personId },
    });

    // Se já tiver cadastrada, barra aqui pra não duplicar
    if (existingEmployee) {
      throw new Error("Esta pessoa já está cadastrada como funcionário");
    }
  }

  // Confere se o cargo existe (pra não vincular a cargo fantasma)

  private async validateRole(roleId: number) {
    // Busca o cargo no banco pelo ID
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    // Se não achou, o cargo não existe
    if (!role) throw new Error("Cargo não encontrado");
  }

  // Cria o registro do funcionário no banco (a parte importante!)

  private async createEmployee(params: {
    personId: number;
    roleId: number;
    registrationNumber: string;
    admissionDate?: Date;
  }): Promise<EmployeeResult> {
    // Cria de fato o registro no banco
    const employee = await prisma.employee.create({
      data: {
        registration_number: params.registrationNumber,
        admission_date: params.admissionDate,
        person_id: params.personId,
        role_id: params.roleId,
      },
    });

    // Devolve só o necessário pro front (sem dados sensíveis)
    return {
      id: employee.id,
      registration_number: employee.registration_number,
      person_id: employee.person_id,
    };
  }
}
