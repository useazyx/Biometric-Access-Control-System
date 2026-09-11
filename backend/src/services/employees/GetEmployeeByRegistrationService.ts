/**
 * GetEmployeeByRegistrationService.ts - Busca funcionário por matrícula
 */

import { prisma } from "../../config/prisma"

interface GetEmployeeByRegistrationRequest {
  registration_number: string
}

interface GetEmployeeByRegistrationResult {
  cpf: string
  person_id: number
  employee_id: number
}

export class GetEmployeeByRegistrationService {
  async execute(request: GetEmployeeByRegistrationRequest): Promise<GetEmployeeByRegistrationResult> {
    const employee = await prisma.employee.findUnique({
      where: { registration_number: request.registration_number },
      include: {
        person: {
          select: {
            id: true,
            cpf: true,
          },
        },
      },
    })

    if (!employee) {
      throw new Error("Funcionário não encontrado")
    }

    if (!employee.person) {
      throw new Error("Pessoa não encontrada para este funcionário")
    }

    return {
      cpf: employee.person.cpf,
      person_id: employee.person.id,
      employee_id: employee.id,
    }
  }
}

