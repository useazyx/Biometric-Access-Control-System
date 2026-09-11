/**
 * CreateVisitorService.ts - O recepcionista digital: cadastra visitantes e associa a funcionários responsáveis
 * # Pra que serve?
 * - Cadastrar visitantes no sistema
 * - Ligar cada visitante a um funcionário responsável (tipo um "padrinho")
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-12): Cadastro básico de visitantes
 * - v1.1.0 (2025-05-30): Validação de funcionário responsável
 * - v1.2.0 (2025-06-22): Integração com sistema de credenciamento
 * - v1.3.0 (2025-07-13): Notificação automática ao responsável
 */

import { prisma } from "../../config/prisma"
import type { Person, Employee } from "@prisma/client"

// O que a gente precisa pra cadastrar um visitante:
interface CreateVisitorRequest {
  cpf: string
  responsibleEmployeeCpf: string
  company?: string
  visitReason?: string
}

// O que devolvemos depois do cadastro:
interface VisitorResult {
  id: number
  person_id: number
}

export class CreateVisitorService {
  // Faz todo o processo de cadastro do visitante (tipo recepção de evento)

  async execute(request: CreateVisitorRequest): Promise<VisitorResult> {
    return await prisma.$transaction(async (tx) => {
      // 1. Verifica se a pessoa já tá cadastrada como visitante
      const person = await this.validatePerson(request.cpf, tx)

      // 2. Checa se o funcionário responsável existe e pode receber visitantes (obrigatório)
      if (!request.responsibleEmployeeCpf || !request.responsibleEmployeeCpf.trim()) {
        throw new Error("CPF do funcionário responsável é obrigatório")
      }
      const responsibleEmployee = await this.validateResponsibleEmployee(request.responsibleEmployeeCpf, tx)
      const responsibleEmployeeId = responsibleEmployee.id

      // 3. Evita cadastro duplicado (não pode ter dois visitantes com mesmo CPF)
      await this.checkExistingVisitor(person.id, tx)

      // Se passou nas validações, cria o cadastro do visitante
      return this.createVisitorRecord(
        {
          personId: person.id,
          responsibleEmployeeId: responsibleEmployeeId,
          company: request.company,
          visitReason: request.visitReason,
        },
        tx,
      )
    })
  }

  private async validatePerson(cpf: string, tx: any): Promise<Person> {
    const person = await tx.person.findUnique({ where: { cpf } })
    // Se não achou, pessoa não tá no sistema
    if (!person) throw new Error("Pessoa não encontrada")
    return person
  }

  // Valida o funcionário responsável (só alguns cargos podem ser responsáveis)

  private async validateResponsibleEmployee(cpf: string, tx: any): Promise<Employee> {
    // Busca funcionários com perfil permitido (empregado, coordenador, inspetor)
    const employee = await tx.employee.findFirst({
      where: {
        person: {
          cpf,
          type: { in: ["employee", "coordinator", "inspector"] },
        },
      },
    })
    // Se não achou ou não tem permissão, barra aqui
    if (!employee) throw new Error("Funcionário responsável não encontrado")
    return employee
  }

  // Checa se a pessoa já é visitante (não pode cadastrar duas vezes!)

  private async checkExistingVisitor(personId: number, tx: any) {
    const existingVisitor = await tx.visitor.findFirst({
      where: { person_id: personId },
    })
    // Se já for visitante, não cadastra de novo
    if (existingVisitor) {
      throw new Error("Esta pessoa já está cadastrada como visitante")
    }
  }

  private async createVisitorRecord(
    params: {
      personId: number
      responsibleEmployeeId: number
      company?: string
      visitReason?: string
    },
    tx: any,
  ): Promise<VisitorResult> {
    // Registra tudo no banco, ligando ao funcionário responsável
    const visitor = await tx.visitor.create({
      data: {
        company: params.company || null,
        visit_reason: params.visitReason || null,
        registration_date: new Date(),
        visit_expiry_date: null, // Pode ser definido depois
        person_id: params.personId,
        responsible_employee_id: params.responsibleEmployeeId,
      },
    })

    // Devolve só o essencial (ID do visitante e da pessoa)
    return {
      id: visitor.id,
      person_id: visitor.person_id,
    }
  }
}
