/**
 * ListStudentsService.ts - O catálogo de alunos: lista estudantes por unidade com paginação
 */

import { prisma } from "../../config/prisma"

interface ListStudentsRequest {
  unit_code: string
  page: number
  page_size: number
}

interface ListStudentsResult {
  students: {
    id: number
    full_name: string
    rm: string
    email: string | null
    person_id: number
    period: string
    course: string | null
    class_name: string | null
    responsible: string | null
    status: string
    registration_unit: {
      id: number
      name: string
      unit_code: string
    }
  }[]
  total: number
  current_page: number
  total_pages: number
}

export class ListStudentsService {
  async execute(params: ListStudentsRequest): Promise<ListStudentsResult> {
    const { unit_code, page, page_size } = params

    const unit = await this.validateUnit(unit_code)

    const [students, total] = await Promise.all([
      this.fetchStudents(unit.id, page, page_size),
      this.getTotalCount(unit.id),
    ])

    const total_pages = Math.ceil(total / page_size)

    return {
      students,
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

  private async fetchStudents(unitId: number, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize

    const students = await prisma.student.findMany({
      where: {
        person: {
          registration_unit_id: unitId,
        },
      },
      skip,
      take: pageSize,
      include: {
        person: {
          include: {
            registration_unit: true,
          },
        },
      },
      orderBy: {
        person: {
          full_name: "asc",
        },
      },
    })

    return students.map((s: any) => ({
      id: s.id,
      full_name: s.person?.full_name || "Desconhecido",
      rm: s.rm || "",
      email: s.person?.email || null,
      person_id: s.person_id,
      period: s.period || "morning",
      course: s.course || null,
      class_name: s.class || null,
      responsible: s.responsible || null,
      status: s.status || "active",
      registration_unit: s.person?.registration_unit
        ? {
            id: s.person.registration_unit.id,
            name: s.person.registration_unit.name,
            unit_code: s.person.registration_unit.unit_code,
          }
        : { id: unitId, name: "Sem unidade", unit_code: "" },
    }))
  }

  private async getTotalCount(unitId: number) {
    return prisma.student.count({
      where: {
        person: {
          registration_unit_id: unitId,
        },
      },
    })
  }
}
