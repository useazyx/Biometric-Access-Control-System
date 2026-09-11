import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "../../config/prisma"

export class GetMeController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        return rep.status(401).send({ error: "Unauthorized" })
      }

      const person = await prisma.person.findUnique({
        where: { id: userId },
        include: {
          student: true,
          employee: true,
          visitor: true,
          registration_unit: true,
        },
      })

      if (!person) {
        return rep.status(404).send({ error: "Pessoa não encontrada" })
      }

      const serializeDate = (d: any) => (d instanceof Date ? d.toISOString() : d)

      const result = {
        id: person.id,
        full_name: person.full_name,
        birth_date: serializeDate(person.birth_date) || null,
        cpf: person.cpf,
        email: person.email,
        phone: person.phone,
        type: person.type,
        main_unit_type: person.main_unit_type,
        registration_unit: person.registration_unit
          ? {
              id: person.registration_unit.id,
              name: person.registration_unit.name,
              unit_code: person.registration_unit.unit_code,
            }
          : null,
        student: person.student
          ? {
              id: person.student.id,
              rm: person.student.rm,
              status: person.student.status,
            }
          : null,
        employee: person.employee
          ? {
              id: person.employee.id,
              registration_number: person.employee.registration_number,
            }
          : null,
        visitor: person.visitor
          ? {
              id: person.visitor.id,
              company: person.visitor.company,
              visit_reason: person.visitor.visit_reason,
              registration_date: serializeDate(person.visitor.registration_date) || null,
              visit_expiry_date: serializeDate(person.visitor.visit_expiry_date) || null,
              responsible_employee_id: person.visitor.responsible_employee_id,
            }
          : null,
      }

      return rep.send(result)
    } catch (error) {
      return rep.status(500).send({ error: "InternalServerError" })
    }
  }
}