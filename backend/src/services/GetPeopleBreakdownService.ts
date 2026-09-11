import { prisma } from "../config/prisma"
import { PersonType } from "@prisma/client"

export interface PeopleBreakdown {
  student: number
  teacher: number
  employee: number
  coordinator: number
  inspector: number
  visitor: number
}

export class GetPeopleBreakdownService {
  async execute(): Promise<PeopleBreakdown> {
    const [student, teacher, employee, coordinator, inspector, visitor] = await Promise.all([
      prisma.person.count({ where: { type: PersonType.student } }),
      prisma.person.count({ where: { type: PersonType.teacher } }),
      prisma.person.count({ where: { type: PersonType.employee } }),
      prisma.person.count({ where: { type: PersonType.coordinator } }),
      prisma.person.count({ where: { type: PersonType.inspector } }),
      prisma.person.count({ where: { type: PersonType.visitor } }),
    ])

    return { student, teacher, employee, coordinator, inspector, visitor }
  }
}