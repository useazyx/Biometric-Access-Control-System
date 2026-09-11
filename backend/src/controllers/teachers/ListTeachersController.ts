import type { FastifyReply, FastifyRequest } from "fastify"
import { ListTeachersService } from "../../services/teachers/ListTeachersService"

export class ListTeachersController {
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

      console.log("[v0] ListTeachersController - Query params:", { unit_code, page, page_size })

      if (!unit_code) {
        return reply.status(400).send({
          error: "unit_code é obrigatório",
          tip: "Inclua unit_code como parâmetro de query",
        })
      }

      const service = new ListTeachersService()
      const result = await service.execute({
        unit_code,
        search,
        page,
        page_size,
      })

      return reply.status(200).send({
        teachers: result.teachers,
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

      console.error("[v0] ListTeachersController error:", error.message, error.stack)
      return reply.status(500).send({
        error: "Opa, não consegui listar os professores!",
        solution: "Verifica os filtros ou tenta de novo mais tarde",
      })
    }
  }
}
