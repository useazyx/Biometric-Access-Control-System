/**
 * ListEmployeesService.ts - O catálogo de funcionários: lista funcionários por unidade com paginação
 * # Pra que serve?
 * - Buscar funcionários de uma unidade específica
 * - Dividir os resultados em páginas (pra não sobrecarregar)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-11-20
 */

import { prisma } from "../../config/prisma"
import { personSearchFilter } from "../../lib/personSearch"

interface ListEmployeesRequest {
  unit_code: string
  search?: string
  page: number
  page_size: number
}

interface ListEmployeesResult {
  employees: {
    id: number
    full_name: string
    registration_number: string
    email: string | null
    cpf: string
    active: boolean
    admission_date: Date | null
    person_id: number
    registration_unit_id: number
    person_type: string
    role_id: number | null
    role_name: string
  }[]
  total: number
  current_page: number
  total_pages: number
}

export class ListEmployeesService {
  async execute(params: ListEmployeesRequest): Promise<ListEmployeesResult> {
    const { unit_code, search, page, page_size } = params

    // Valida a unidade
    const unit = await this.validateUnit(unit_code)

    // Busca em paralelo: a lista de funcionários e o total
    const [employees, total] = await Promise.all([
      this.fetchEmployees(unit.id, page, page_size, search),
      this.getTotalCount(unit.id, search),
    ])

    // Calcula quantas páginas vão ter no total
    const total_pages = Math.ceil(total / page_size)

    return {
      employees,
      total,
      current_page: page,
      total_pages,
    }
  }

  private async validateUnit(unitCode: string) {
    const unit = await prisma.unit.findUnique({
      where: { unit_code: unitCode },
    })

    if (!unit) throw new Error("Unidade não encontrada")
    return unit
  }

  private async fetchEmployees(unitId: number, page: number, pageSize: number, search?: string) {
    const skip = (page - 1) * pageSize

    const employees = await prisma.employee.findMany({
      where: {
        person: {
          registration_unit_id: unitId,
          ...personSearchFilter(search),
        },
      },
      skip,
      take: pageSize,
      select: {
        id: true,
        registration_number: true,
        active: true,
        admission_date: true,
        person: {
          select: {
            id: true,
            full_name: true,
            email: true,
            cpf: true,
            registration_unit_id: true,
            type: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        person: {
          full_name: "asc",
        },
      },
    })

    return employees.map((emp: any) => ({
      id: emp.id,
      full_name: emp.person.full_name,
      registration_number: emp.registration_number,
      email: emp.person.email,
      cpf: emp.person.cpf,
      active: emp.active,
      admission_date: emp.admission_date || null,
      person_id: emp.person.id,
      registration_unit_id: emp.person.registration_unit_id,
      person_type: emp.person.type,
      role_id: emp.role?.id || null,
      role_name: emp.role?.name || "Sem cargo definido",
    }))
  }

  private async getTotalCount(unitId: number, search?: string) {
    return prisma.employee.count({
      where: {
        person: {
          registration_unit_id: unitId,
          ...personSearchFilter(search),
        },
      },
    })
  }
}
