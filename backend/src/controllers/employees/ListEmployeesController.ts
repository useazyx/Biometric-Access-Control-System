import type { FastifyReply, FastifyRequest } from "fastify"
import { ListEmployeesService } from "../../services/employees/ListEmployeesService"

export class ListEmployeesController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        unit_code: string
        page?: string
        page_size?: string
      }

      const unit_code = query?.unit_code
      const page = Number.parseInt(query?.page || "1")
      const page_size = Number.parseInt(query?.page_size || "20")

      // Validação básica
      if (!unit_code) {
        return reply.status(400).send({
          error: "unit_code é obrigatório",
          tip: "Inclua unit_code como parâmetro de query",
        })
      }

      // Manda o serviço buscar os funcionários com esses filtros
      const service = new ListEmployeesService()
      const result = await service.execute({
        unit_code,
        page,
        page_size,
      })

      const employeesFlattened = result.employees.map((employee: any) => ({
        id: employee.id,
        full_name: employee.full_name,
        registration_number: employee.registration_number,
        email: employee.email,
        cpf: employee.cpf,
        active: employee.active,
        admission_date: employee.admission_date,
        registration_unit_id: employee.registration_unit_id,
        person_type: employee.person_type,
        role_name: employee.role_name,
      }))

      return reply.status(200).send({
        employees: employeesFlattened,
        total: result.total,
        current_page: result.current_page,
        total_pages: result.total_pages,
      })
    } catch (error: any) {
      // Se a unidade não foi encontrada
      if (error.message === "Unidade não encontrada") {
        return reply.status(404).send({
          error: "Unidade não encontrada",
          tip: "Confere o código da unidade, tá certo?",
        })
      }

      console.error("ListEmployeesController error:", error.message)
      return reply.status(500).send({
        error: "Opa, não consegui listar os funcionários!",
        solution: "Verifica os filtros ou tenta de novo mais tarde",
      })
    }
  }
}
