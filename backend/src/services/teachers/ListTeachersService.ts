/**
 * ListTeachersService.ts - Lista de professores por unidade
 */

import { prisma } from "../../config/prisma"
import { personSearchFilter } from "../../lib/personSearch"

interface ListTeachersRequest {
  unit_code: string
  search?: string
  page: number
  page_size: number
}

interface ListTeachersResult {
  teachers: {
    id: number
    full_name: string
    subjects: string[]
    can_teach_fatec: boolean
    can_teach_etec: boolean
    employee_id: number
    person_id: number
  }[]
  total: number
  current_page: number
  total_pages: number
}

export class ListTeachersService {
  async execute(params: ListTeachersRequest): Promise<ListTeachersResult> {
    const { unit_code, search, page, page_size } = params

    const unit = await this.validateUnit(unit_code)

    const [teachers, total] = await Promise.all([
      this.fetchTeachers(unit.id, page, page_size, search),
      this.getTotalCount(unit.id, search),
    ])

    const total_pages = Math.ceil(total / page_size)

    return {
      teachers,
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

  private async fetchTeachers(unitId: number, page: number, pageSize: number, search?: string) {
    const skip = (page - 1) * pageSize

    const teachers = await prisma.teacher.findMany({
      where: {
        employee: {
          person: {
            registration_unit_id: unitId,
            ...personSearchFilter(search),
          },
        },
      },
      skip,
      take: pageSize,
      include: {
        employee: {
          include: {
            person: true,
          },
        },
      },
      orderBy: {
        employee: {
          person: {
            full_name: "asc",
          },
        },
      },
    })

    return teachers
      .filter((t: any) => t.employee?.person !== null)
      .map((t: any) => ({
        id: t.id,
        full_name: t.employee?.person?.full_name || "Desconhecido",
        subjects: Array.isArray(t.subjects) ? t.subjects : [],
        can_teach_fatec: Boolean(t.can_teach_fatec),
        can_teach_etec: Boolean(t.can_teach_etec),
        employee_id: t.employee_id || 0,
        person_id: t.employee?.person_id || 0,
      }))
  }

  private async getTotalCount(unitId: number, search?: string) {
    return prisma.teacher.count({
      where: {
        employee: {
          person: {
            registration_unit_id: unitId,
            ...personSearchFilter(search),
          },
        },
      },
    })
  }
}
