import type { FastifyReply, FastifyRequest } from "fastify"
import { ListStudentsService } from "../../services/students/ListStudentsService"

export class ListStudentsController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        unit_code: string
        search?: string
        page?: string
        page_size?: string
      }

      const unit_code = query?.unit_code
      // Vem vazio quando a pessoa limpa o campo: nesse caso é "sem busca"
      const search = query?.search?.trim() || undefined
      const page = Number.parseInt(query?.page || "1")
      const page_size = Number.parseInt(query?.page_size || "20")

      if (!unit_code) {
        return reply.status(400).send({
          error: "unit_code é obrigatório",
          tip: "Inclua unit_code como parâmetro de query",
        })
      }

      const service = new ListStudentsService()
      const result = await service.execute({
        unit_code,
        search,
        page,
        page_size,
      })

      return reply.status(200).send({
        students: result.students,
        total: result.total,
        current_page: result.current_page,
        total_pages: result.total_pages,
      })
    } catch (error: any) {
      if (error.message === "Unidade não encontrada") {
        return reply.status(404).send({
          error: "Unidade não encontrada",
          tip: "Confere o código da unidade, tá certo?",
        })
      }

      console.error("[v0] ListStudentsController error:", error.message, error.stack)
      return reply.status(500).send({
        error: "Opa, não consegui listar os alunos!",
        solution: "Verifica os filtros ou tenta de novo mais tarde",
      })
    }
  }
}
