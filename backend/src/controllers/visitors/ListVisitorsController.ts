/**
 * ListVisitorsController.ts - Lista visitantes
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { ListVisitorsService } from "../../services/visitors/ListVisitorsService"

export class ListVisitorsController {
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

      if (!unit_code) {
        return reply.status(400).send({
          error: "unit_code é obrigatório",
          tip: "Inclua unit_code como parâmetro de query",
        })
      }

      const service = new ListVisitorsService()
      const result = await service.execute({
        unit_code,
        page,
        page_size,
      })

      return reply.status(200).send({
        visitors: result.visitors,
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

      console.error("ListVisitorsController error:", error.message)
      return reply.status(500).send({
        error: "Opa, não consegui listar os visitantes!",
        solution: "Verifica os filtros ou tenta de novo mais tarde",
      })
    }
  }
}

