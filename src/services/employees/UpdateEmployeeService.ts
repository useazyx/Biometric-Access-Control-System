/**
 * UpdateEmployeeService.ts - O ajustador de funcionários: atualiza dados de colaboradores
 * # Pra que serve?
 * - Atualizar informações de funcionários (como cargo e status)
 * - Validar se as mudanças pedidas fazem sentido
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-10): Implementação inicial de atualização
 * - v1.1.0 (2025-06-25): Validação de existência de cargo
 * - v1.2.0 (2025-07-13): Suporte a atualização parcial de campos
 */

import { prisma } from "../../config/prisma";

// O que precisamos pra atualizar um funcionário:
interface UpdateEmployeeRequest {
  cpf: string;
  role_name?: string;
  active?: boolean;
}

// O que a gente devolve quando atualiza:
interface UpdateResult {
  message: string;
  updated_employee: {
    id: number;
    registration_number: string;
  };
}

// Serviço que atualiza funcionários - tipo o RH fazendo os ajustes

export class UpdateEmployeeService {
  // Faz toda a mágica de atualizar um funcionário

  async execute(request: UpdateEmployeeRequest): Promise<UpdateResult> {
    // 1. Busca a pessoa e o cadastro de funcionário pelo CPF
    const { person, employee } = await this.getPersonAndEmployee(request.cpf);
    // 2. Prepara os dados pra atualização (converte cargo em ID, etc)
    const updateData = await this.prepareUpdateData(
      request.role_name,
      request.active
    );

    // 3. Manda atualizar no banco de dados
    const updatedEmployee = await this.updateEmployee(employee.id, updateData);

    // Monta a resposta bonitinha
    return {
      message: "Funcionário atualizado com sucesso",
      updated_employee: {
        id: updatedEmployee.id,
        registration_number: updatedEmployee.registration_number,
      },
    };
  }
  // Pega a pessoa e o cadastro dela como funcionário (pelo CPF)

  private async getPersonAndEmployee(cpf: string) {
    // Busca a pessoa no banco, trazendo junto o cadastro de funcionário
    const person = await prisma.person.findUnique({
      where: { cpf },
      include: { employee: true },
    });

    // Se não achou a pessoa, ou se ela não é funcionária, barra aqui
    if (!person) throw new Error("Pessoa não encontrada");
    if (!person.employee) throw new Error("Esta pessoa não é um funcionário");

    return { person, employee: person.employee };
  }

  // Prepara os dados pra atualização: converte cargo em ID, valida, etc

  private async prepareUpdateData(roleName?: string, active?: boolean) {
    // Começa vazio - vai juntando o que precisa atualizar
    const updateData: { role_id?: number; active?: boolean } = {};

    // Se mandaram um nome de cargo, busca o ID desse cargo
    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      // Se não achou o cargo, não pode atualizar
      if (!role) throw new Error("Cargo não encontrado");
      updateData.role_id = role.id;
    }

    // Se mandaram atualizar o status (ativo/inativo), coloca nos dados
    if (active !== undefined) {
      updateData.active = active;
    }

    // Se não tiver nada pra atualizar (tudo vazio), barra aqui
    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum dado válido fornecido para atualização");
    }

    return updateData;
  }

  // Atualiza o funcionário no banco de dados

  private async updateEmployee(
    employeeId: number,
    updateData: { role_id?: number; active?: boolean }
  ) {
    // Atualiza só os campos que vieram (não mexe no resto)
    return prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
    });
  }
}
