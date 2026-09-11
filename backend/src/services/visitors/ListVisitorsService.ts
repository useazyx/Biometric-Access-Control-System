/**
 * ListVisitorsService.ts - Lista visitantes por unidade
 */

import { prisma } from "../../config/prisma"

interface ListVisitorsRequest {
  unit_code: string
  page: number
  page_size: number
}

interface ListVisitorsResult {
  visitors: {
    id: number
    company: string | null
    visit_reason: string | null
    registration_date: Date
    visit_expiry_date: Date | null
    person_id: number
    responsible_employee_id: number | null
    person: {
      id: number
      full_name: string
      cpf: string
      email: string | null
    }
    responsible_employee: {
      id: number
      person: {
        id: number
        full_name: string
        cpf: string
      }
    } | null
  }[]
  total: number
  current_page: number
  total_pages: number
}

export class ListVisitorsService {
  async execute(params: ListVisitorsRequest): Promise<ListVisitorsResult> {
    const { unit_code, page, page_size } = params

    const unit = await this.validateUnit(unit_code)

    const [visitors, total] = await Promise.all([
      this.fetchVisitors(unit.id, page, page_size),
      this.getTotalCount(unit.id),
    ])

    const total_pages = Math.ceil(total / page_size)

    return {
      visitors,
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

  private async fetchVisitors(unitId: number, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize

    const visitors = await prisma.visitor.findMany({
      where: {
        person: {
          registration_unit_id: unitId,
        },
      },
      skip,
      take: pageSize,
      include: {
        person: {
          select: {
            id: true,
            full_name: true,
            cpf: true,
            email: true,
          },
        },
        responsible_employee: {
          include: {
            person: {
              select: {
                id: true,
                full_name: true,
                cpf: true,
              },
            },
          },
        },
      },
      orderBy: {
        registration_date: "desc",
      },
    })

    return visitors.map((v: any) => ({
      id: v.id,
      company: v.company,
      visit_reason: v.visit_reason,
      registration_date: v.registration_date,
      visit_expiry_date: v.visit_expiry_date,
      person_id: v.person_id,
      responsible_employee_id: v.responsible_employee_id,
      person: {
        id: v.person.id,
        full_name: v.person.full_name,
        cpf: v.person.cpf,
        email: v.person.email,
      },
      responsible_employee: v.responsible_employee ? {
        id: v.responsible_employee.id,
        person: {
          id: v.responsible_employee.person.id,
          full_name: v.responsible_employee.person.full_name,
          cpf: v.responsible_employee.person.cpf,
        },
      } : null,
    }))
  }

  private async getTotalCount(unitId: number) {
    return prisma.visitor.count({
      where: {
        person: {
          registration_unit_id: unitId,
        },
      },
    })
  }
}

